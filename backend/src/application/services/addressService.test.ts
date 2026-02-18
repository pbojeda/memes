import {
  listAddresses,
  createAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
} from './addressService';
import prisma from '../../lib/prisma';
import {
  AddressNotFoundError,
  AddressLimitExceededError,
  InvalidAddressDataError,
  DefaultAddressCannotBeDeletedError,
} from '../../domain/errors/AddressError';
import type { Address } from '../../generated/prisma/client';

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    address: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const ADDRESS_ID = '223e4567-e89b-12d3-a456-426614174001';

const mockAddress: Address = {
  id: ADDRESS_ID,
  userId: USER_ID,
  label: null,
  firstName: 'John',
  lastName: 'Doe',
  streetLine1: '123 Main St',
  streetLine2: null,
  city: 'Springfield',
  state: null,
  postalCode: '12345',
  countryCode: 'US',
  phone: null,
  isDefault: false,
  createdAt: new Date('2026-02-18'),
  updatedAt: new Date('2026-02-18'),
};

describe('addressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listAddresses', () => {
    it('should return addresses ordered by createdAt ascending', async () => {
      (mockPrisma.address.findMany as jest.Mock).mockResolvedValue([mockAddress]);

      const result = await listAddresses(USER_ID);

      expect(mockPrisma.address.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual([mockAddress]);
    });

    it('should return empty array when user has no addresses', async () => {
      (mockPrisma.address.findMany as jest.Mock).mockResolvedValue([]);

      const result = await listAddresses(USER_ID);

      expect(result).toEqual([]);
    });

    it('should only return addresses belonging to userId', async () => {
      (mockPrisma.address.findMany as jest.Mock).mockResolvedValue([mockAddress]);

      await listAddresses(USER_ID);

      expect(mockPrisma.address.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: USER_ID } })
      );
    });
  });

  describe('createAddress', () => {
    const validInput = {
      firstName: 'John',
      lastName: 'Doe',
      streetLine1: '123 Main St',
      city: 'Springfield',
      postalCode: '12345',
      countryCode: 'US',
    };

    it('should create address with valid input and isDefault false', async () => {
      (mockPrisma.address.count as jest.Mock).mockResolvedValue(3);
      (mockPrisma.address.create as jest.Mock).mockResolvedValue(mockAddress);

      const result = await createAddress(USER_ID, validInput);

      expect(mockPrisma.address.count).toHaveBeenCalledWith({ where: { userId: USER_ID } });
      expect(mockPrisma.address.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: USER_ID, isDefault: false }),
      });
      expect(result).toEqual(mockAddress);
    });

    it('should create address with isDefault false by default', async () => {
      (mockPrisma.address.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.address.create as jest.Mock).mockResolvedValue(mockAddress);

      await createAddress(USER_ID, validInput);

      expect(mockPrisma.address.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isDefault: false }),
      });
    });

    it('should create address with isDefault true and call transaction to unset previous default', async () => {
      const inputWithDefault = { ...validInput, isDefault: true };
      const createdAddress = { ...mockAddress, isDefault: true };

      (mockPrisma.address.count as jest.Mock).mockResolvedValue(2);
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([{ count: 1 }, createdAddress]);

      const result = await createAddress(USER_ID, inputWithDefault);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(createdAddress);
    });

    it('should throw AddressLimitExceededError when user already has 10 addresses', async () => {
      (mockPrisma.address.count as jest.Mock).mockResolvedValue(10);

      await expect(createAddress(USER_ID, validInput)).rejects.toThrow(AddressLimitExceededError);
      expect(mockPrisma.address.create).not.toHaveBeenCalled();
    });

    it('should throw InvalidAddressDataError when input is invalid', async () => {
      const invalidInput = {
        firstName: '',
        lastName: 'Doe',
        streetLine1: 'x',
        city: 'y',
        postalCode: 'z',
        countryCode: 'US',
      };

      await expect(createAddress(USER_ID, invalidInput)).rejects.toThrow(InvalidAddressDataError);
      expect(mockPrisma.address.count).not.toHaveBeenCalled();
    });

    it('should create first address as default automatically even if isDefault not set', async () => {
      (mockPrisma.address.count as jest.Mock).mockResolvedValue(0);
      const firstAddress = { ...mockAddress, isDefault: true };
      (mockPrisma.address.create as jest.Mock).mockResolvedValue(firstAddress);

      const result = await createAddress(USER_ID, validInput);

      expect(mockPrisma.address.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isDefault: true }),
      });
      expect(result.isDefault).toBe(true);
    });
  });

  describe('getAddressById', () => {
    it('should return address when found and belongs to userId', async () => {
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddress);

      const result = await getAddressById(USER_ID, ADDRESS_ID);

      expect(mockPrisma.address.findFirst).toHaveBeenCalledWith({
        where: { id: ADDRESS_ID, userId: USER_ID },
      });
      expect(result).toEqual(mockAddress);
    });

    it('should throw AddressNotFoundError when address not found', async () => {
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getAddressById(USER_ID, ADDRESS_ID)).rejects.toThrow(AddressNotFoundError);
    });

    it('should throw AddressNotFoundError when address exists but belongs to different user', async () => {
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(getAddressById('other-user-id', ADDRESS_ID)).rejects.toThrow(
        AddressNotFoundError
      );
    });

    it('should throw InvalidAddressDataError when addressId is invalid UUID', async () => {
      await expect(getAddressById(USER_ID, 'not-a-uuid')).rejects.toThrow(InvalidAddressDataError);
      expect(mockPrisma.address.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('updateAddress', () => {
    const updateInput = { firstName: 'Jane' };

    it('should update address fields with valid input', async () => {
      const updatedAddress = { ...mockAddress, firstName: 'Jane' };
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddress);
      (mockPrisma.address.update as jest.Mock).mockResolvedValue(updatedAddress);

      const result = await updateAddress(USER_ID, ADDRESS_ID, updateInput);

      expect(mockPrisma.address.findFirst).toHaveBeenCalledWith({
        where: { id: ADDRESS_ID, userId: USER_ID },
      });
      expect(mockPrisma.address.update).toHaveBeenCalledWith({
        where: { id: ADDRESS_ID },
        data: { firstName: 'Jane' },
      });
      expect(result).toEqual(updatedAddress);
    });

    it('should throw AddressNotFoundError when address not found', async () => {
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(updateAddress(USER_ID, ADDRESS_ID, updateInput)).rejects.toThrow(
        AddressNotFoundError
      );
      expect(mockPrisma.address.update).not.toHaveBeenCalled();
    });

    it('should update isDefault and call transaction when isDefault is set to true', async () => {
      const updatedAddress = { ...mockAddress, isDefault: true };
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddress);
      (mockPrisma.$transaction as jest.Mock).mockResolvedValue([{ count: 1 }, updatedAddress]);

      const result = await updateAddress(USER_ID, ADDRESS_ID, { isDefault: true });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(updatedAddress);
    });

    it('should throw InvalidAddressDataError when addressId is invalid UUID', async () => {
      await expect(updateAddress(USER_ID, 'not-a-uuid', updateInput)).rejects.toThrow(
        InvalidAddressDataError
      );
      expect(mockPrisma.address.findFirst).not.toHaveBeenCalled();
    });

    it('should throw InvalidAddressDataError when input is invalid', async () => {
      await expect(updateAddress(USER_ID, ADDRESS_ID, { countryCode: 'USA' })).rejects.toThrow(
        InvalidAddressDataError
      );
      expect(mockPrisma.address.findFirst).not.toHaveBeenCalled();
    });

    it('should allow empty update (no fields changed)', async () => {
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(mockAddress);
      (mockPrisma.address.update as jest.Mock).mockResolvedValue(mockAddress);

      const result = await updateAddress(USER_ID, ADDRESS_ID, {});

      expect(mockPrisma.address.update).toHaveBeenCalledWith({
        where: { id: ADDRESS_ID },
        data: {},
      });
      expect(result).toEqual(mockAddress);
    });
  });

  describe('deleteAddress', () => {
    it('should delete address when it is not the default', async () => {
      const nonDefaultAddress = { ...mockAddress, isDefault: false };
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(nonDefaultAddress);
      (mockPrisma.address.delete as jest.Mock).mockResolvedValue(nonDefaultAddress);

      await deleteAddress(USER_ID, ADDRESS_ID);

      expect(mockPrisma.address.delete).toHaveBeenCalledWith({ where: { id: ADDRESS_ID } });
    });

    it('should delete address when it is the only address (even if default)', async () => {
      const defaultAddress = { ...mockAddress, isDefault: true };
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(defaultAddress);
      (mockPrisma.address.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.address.delete as jest.Mock).mockResolvedValue(defaultAddress);

      await deleteAddress(USER_ID, ADDRESS_ID);

      expect(mockPrisma.address.delete).toHaveBeenCalledWith({ where: { id: ADDRESS_ID } });
    });

    it('should throw DefaultAddressCannotBeDeletedError when address is default and user has more than one address', async () => {
      const defaultAddress = { ...mockAddress, isDefault: true };
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(defaultAddress);
      (mockPrisma.address.count as jest.Mock).mockResolvedValue(2);

      await expect(deleteAddress(USER_ID, ADDRESS_ID)).rejects.toThrow(
        DefaultAddressCannotBeDeletedError
      );
      expect(mockPrisma.address.delete).not.toHaveBeenCalled();
    });

    it('should throw AddressNotFoundError when address not found', async () => {
      (mockPrisma.address.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(deleteAddress(USER_ID, ADDRESS_ID)).rejects.toThrow(AddressNotFoundError);
      expect(mockPrisma.address.delete).not.toHaveBeenCalled();
    });

    it('should throw InvalidAddressDataError when addressId is invalid UUID', async () => {
      await expect(deleteAddress(USER_ID, 'not-a-uuid')).rejects.toThrow(InvalidAddressDataError);
      expect(mockPrisma.address.findFirst).not.toHaveBeenCalled();
    });
  });
});
