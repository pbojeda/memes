import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../../lib/prisma';
import { env } from '../../config/env';
import {
  TokenExpiredError,
  InvalidTokenError,
  UserNotFoundError,
  JwtSecretNotConfiguredError,
} from '../../domain/errors/AuthError';
import { UserRole } from '../../generated/prisma/enums';

// Runtime validation schema for JWT payload
const TokenPayloadSchema = z.object({
  userId: z.string(),
  email: z.string(),
  role: z.nativeEnum(UserRole),
});

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
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

function getJwtSecret(): string {
  if (!env.JWT_SECRET) {
    throw new JwtSecretNotConfiguredError();
  }
  return env.JWT_SECRET;
}

/**
 * Generates a signed JWT access token for the given user.
 * @throws {JwtSecretNotConfiguredError} If JWT_SECRET is not configured
 */
export function generateAccessToken(user: AuthUser): string {
  const secret = getJwtSecret();

  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, secret, {
    expiresIn: env.JWT_ACCESS_EXPIRATION as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Generates a refresh token and stores its hash in the database.
 * @throws {UserNotFoundError} If user does not exist
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new UserNotFoundError();
  }

  // Generate random token
  const refreshToken = crypto.randomBytes(env.REFRESH_TOKEN_BYTES).toString('hex');

  // Hash and store
  const refreshTokenHash = await bcrypt.hash(refreshToken, env.BCRYPT_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash },
  });

  return refreshToken;
}

/**
 * Verifies and decodes a JWT access token.
 * @throws {JwtSecretNotConfiguredError} If JWT_SECRET is not configured
 * @throws {TokenExpiredError} If token has expired
 * @throws {InvalidTokenError} If token is invalid
 */
export function verifyAccessToken(token: string): TokenPayload {
  const secret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, secret);
    // Runtime validation of payload structure
    const payload = TokenPayloadSchema.parse(decoded);
    return payload;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredError();
      }
    }
    throw new InvalidTokenError();
  }
}

/**
 * Validates a refresh token and issues a new token pair.
 * Implements refresh token rotation for security.
 * @throws {UserNotFoundError} If user does not exist
 * @throws {InvalidTokenError} If refresh token is invalid or doesn't match
 */
export async function refreshTokens(
  refreshToken: string,
  userId: string
): Promise<TokenPair> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new UserNotFoundError();
  }

  if (!user.refreshTokenHash) {
    throw new InvalidTokenError();
  }

  const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);

  if (!isValid) {
    throw new InvalidTokenError();
  }

  // Generate new tokens (rotation)
  const newRefreshToken = crypto.randomBytes(env.REFRESH_TOKEN_BYTES).toString('hex');
  const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, env.BCRYPT_SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: newRefreshTokenHash },
  });

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    isActive: user.isActive,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}
