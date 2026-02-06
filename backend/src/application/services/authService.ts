import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import { env } from '../../config/env';
import { validateRegisterInput, validateLoginInput } from '../validators/authValidator';
import {
  InvalidCredentialsError,
  EmailAlreadyExistsError,
  UserNotActiveError,
  UserNotFoundError,
  PasswordResetTokenInvalidError,
  PasswordResetTokenExpiredError,
} from '../../domain/errors/AuthError';
import type { UserRole } from '../../generated/prisma/enums';

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
}

interface UserWithPasswordHash {
  id: string;
  email: string;
  passwordHash: string | null;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  deletedAt: Date | null;
}

function toAuthUser(user: UserWithPasswordHash): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

/**
 * Registers a new user with the provided credentials.
 * @throws {EmailAlreadyExistsError} If email is already registered
 * @throws {ValidationError} If input validation fails
 */
export async function register(input: RegisterInput): Promise<AuthUser> {
  const validated = validateRegisterInput(input);

  const existingUser = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    throw new EmailAlreadyExistsError();
  }

  const passwordHash = await bcrypt.hash(validated.password, env.BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: validated.email,
      passwordHash,
      firstName: validated.firstName,
      lastName: validated.lastName,
    },
  });

  return toAuthUser(user);
}

/**
 * Authenticates a user with email and password.
 * @throws {InvalidCredentialsError} If email or password is incorrect
 * @throws {UserNotActiveError} If user account is inactive or deleted
 * @throws {ValidationError} If input validation fails
 */
export async function login(input: LoginInput): Promise<AuthUser> {
  const validated = validateLoginInput(input);

  const user = await prisma.user.findUnique({
    where: { email: validated.email },
  });

  // NOTE: There's a known timing difference between "user not found" and
  // "user found but inactive" - see docs/project_notes/tech-debt.md TD-001
  if (!user || !user.passwordHash) {
    throw new InvalidCredentialsError();
  }

  // Check active status before password to prevent timing attacks
  // that could reveal if an email exists with correct password but inactive account
  if (!user.isActive || user.deletedAt) {
    throw new UserNotActiveError();
  }

  const isPasswordValid = await bcrypt.compare(validated.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new InvalidCredentialsError();
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return toAuthUser(updatedUser);
}

/**
 * Logs out a user by clearing their refresh token.
 * @throws {UserNotFoundError} If user does not exist
 */
export async function logout(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new UserNotFoundError();
  }

  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null },
  });
}

const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1;
const PASSWORD_RESET_HASH_ROUNDS = 10;

/**
 * Initiates password reset by generating a token and storing its hash.
 * Returns the plain token for logging/email, or null if user doesn't exist.
 * Always completes without error to prevent user enumeration.
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Security: Don't reveal if email exists
  if (!user) {
    return null;
  }

  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');

  // Hash the token before storing
  const hashedToken = await bcrypt.hash(token, PASSWORD_RESET_HASH_ROUNDS);

  // Set expiration to 1 hour from now
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: expiresAt,
    },
  });

  return token;
}

/**
 * Resets user password using a valid reset token.
 * @throws {PasswordResetTokenInvalidError} If token is invalid or doesn't match
 * @throws {PasswordResetTokenExpiredError} If token has expired
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  // Find user with a password reset token that hasn't been cleared
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: { not: null },
    },
  });

  if (!user || !user.passwordResetToken) {
    throw new PasswordResetTokenInvalidError();
  }

  // Verify token matches
  const isTokenValid = await bcrypt.compare(token, user.passwordResetToken);

  if (!isTokenValid) {
    throw new PasswordResetTokenInvalidError();
  }

  // Check expiration
  if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
    throw new PasswordResetTokenExpiredError();
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

  // Update password and clear reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newPasswordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
}
