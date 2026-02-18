import prisma from '../../lib/prisma';
import {
  validateCreateAddressInput,
  validateUpdateAddressInput,
  validateAddressId,
  type CreateAddressInput,
  type UpdateAddressInput,
} from '../validators/addressValidator';
import {
  AddressNotFoundError,
  AddressLimitExceededError,
  DefaultAddressCannotBeDeletedError,
} from '../../domain/errors/AddressError';
import type { Address } from '../../generated/prisma/client';

const MAX_ADDRESSES_PER_USER = 10;

/**
 * Returns all addresses for a user ordered by createdAt ascending.
 */
export async function listAddresses(userId: string): Promise<Address[]> {
  return prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Creates a new address for the user.
 * @throws {InvalidAddressDataError} If input validation fails
 * @throws {AddressLimitExceededError} If user already has 10 addresses
 */
export async function createAddress(userId: string, input: CreateAddressInput): Promise<Address> {
  const validated = validateCreateAddressInput(input);

  const count = await prisma.address.count({ where: { userId } });

  if (count >= MAX_ADDRESSES_PER_USER) {
    throw new AddressLimitExceededError();
  }

  // First address is always default regardless of input value
  const isDefault = count === 0 ? true : validated.isDefault;

  if (isDefault && count > 0) {
    // Use transaction to atomically unset previous default and create new default
    const [, created] = await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.address.create({
        data: { userId, ...validated, isDefault: true },
      }),
    ]);
    return created;
  }

  return prisma.address.create({
    data: { userId, ...validated, isDefault },
  });
}

/**
 * Returns a single address by ID, scoped to the authenticated user.
 * @throws {InvalidAddressDataError} If addressId is not a valid UUID
 * @throws {AddressNotFoundError} If address not found or belongs to different user
 */
export async function getAddressById(userId: string, addressId: string): Promise<Address> {
  validateAddressId(addressId);

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!address) {
    throw new AddressNotFoundError();
  }

  return address;
}

/**
 * Updates an address for the user.
 * @throws {InvalidAddressDataError} If addressId or input is invalid
 * @throws {AddressNotFoundError} If address not found
 */
export async function updateAddress(
  userId: string,
  addressId: string,
  input: UpdateAddressInput
): Promise<Address> {
  validateAddressId(addressId);
  const validated = validateUpdateAddressInput(input);

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    throw new AddressNotFoundError();
  }

  if (validated.isDefault === true) {
    const [, updated] = await prisma.$transaction([
      prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.address.update({
        where: { id: addressId },
        data: validated,
      }),
    ]);
    return updated;
  }

  return prisma.address.update({
    where: { id: addressId },
    data: validated,
  });
}

/**
 * Deletes an address for the user.
 * @throws {InvalidAddressDataError} If addressId is not a valid UUID
 * @throws {AddressNotFoundError} If address not found
 * @throws {DefaultAddressCannotBeDeletedError} If address is default and user has more than one
 */
export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  validateAddressId(addressId);

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    throw new AddressNotFoundError();
  }

  if (existing.isDefault) {
    const count = await prisma.address.count({ where: { userId } });
    if (count > 1) {
      throw new DefaultAddressCannotBeDeletedError();
    }
  }

  await prisma.address.delete({ where: { id: addressId } });
}
