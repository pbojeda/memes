import { addressService } from './addressService';
import { apiClient } from '../api/client';
import { ApiException } from '../api/exceptions';
import type { components } from '../api/types';

type Address = components['schemas']['Address'];
type CreateAddressRequest = components['schemas']['CreateAddressRequest'];
type UpdateAddressRequest = components['schemas']['UpdateAddressRequest'];

jest.mock('../api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const mockAddress: Address = {
  id: 'addr-1',
  label: 'Home',
  firstName: 'John',
  lastName: 'Doe',
  streetLine1: '123 Main St',
  streetLine2: 'Apt 4B',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  countryCode: 'US',
  phone: '+1-555-555-5555',
  isDefault: true,
};

const mockCreateRequest: CreateAddressRequest = {
  firstName: 'John',
  lastName: 'Doe',
  streetLine1: '123 Main St',
  city: 'New York',
  postalCode: '10001',
  countryCode: 'US',
  isDefault: false,
};

const mockUpdateRequest: UpdateAddressRequest = {
  firstName: 'Jane',
  city: 'Los Angeles',
};

describe('addressService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should call GET /users/me/addresses', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { data: [mockAddress] } });

      await addressService.list();

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/me/addresses');
    });

    it('should return Address array from response data', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { data: [mockAddress] } });

      const result = await addressService.list();

      expect(result).toEqual([mockAddress]);
    });

    it('should return empty array when no addresses exist', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { data: [] } });

      const result = await addressService.list();

      expect(result).toEqual([]);
    });

    it('should propagate ApiException on 401', async () => {
      mockApiClient.get.mockRejectedValueOnce(
        new ApiException('UNAUTHORIZED', 'Authentication required', 401)
      );

      await expect(addressService.list()).rejects.toThrow(ApiException);
    });
  });

  describe('create', () => {
    it('should call POST /users/me/addresses with request body', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: { data: mockAddress } });

      await addressService.create(mockCreateRequest);

      expect(mockApiClient.post).toHaveBeenCalledWith('/users/me/addresses', mockCreateRequest);
    });

    it('should return Address from response data', async () => {
      mockApiClient.post.mockResolvedValueOnce({ data: { data: mockAddress } });

      const result = await addressService.create(mockCreateRequest);

      expect(result).toEqual(mockAddress);
    });

    it('should propagate ApiException on 400 INVALID_ADDRESS_DATA', async () => {
      mockApiClient.post.mockRejectedValueOnce(
        new ApiException('INVALID_ADDRESS_DATA', 'Invalid address data', 400)
      );

      await expect(addressService.create(mockCreateRequest)).rejects.toThrow(ApiException);
    });

    it('should propagate ApiException on 409 ADDRESS_LIMIT_EXCEEDED', async () => {
      mockApiClient.post.mockRejectedValueOnce(
        new ApiException('ADDRESS_LIMIT_EXCEEDED', 'Address limit reached', 409)
      );

      try {
        await addressService.create(mockCreateRequest);
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(409);
        expect((e as ApiException).code).toBe('ADDRESS_LIMIT_EXCEEDED');
      }
    });
  });

  describe('update', () => {
    it('should call PATCH /users/me/addresses/{addressId} with request body', async () => {
      mockApiClient.patch.mockResolvedValueOnce({ data: { data: { ...mockAddress, ...mockUpdateRequest } } });

      await addressService.update('addr-1', mockUpdateRequest);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/users/me/addresses/addr-1', mockUpdateRequest);
    });

    it('should return Address from response data', async () => {
      const updatedAddress = { ...mockAddress, ...mockUpdateRequest };
      mockApiClient.patch.mockResolvedValueOnce({ data: { data: updatedAddress } });

      const result = await addressService.update('addr-1', mockUpdateRequest);

      expect(result).toEqual(updatedAddress);
    });

    it('should propagate ApiException on 400', async () => {
      mockApiClient.patch.mockRejectedValueOnce(
        new ApiException('INVALID_ADDRESS_DATA', 'Invalid address data', 400)
      );

      await expect(addressService.update('addr-1', mockUpdateRequest)).rejects.toThrow(ApiException);
    });

    it('should propagate ApiException on 404', async () => {
      mockApiClient.patch.mockRejectedValueOnce(
        new ApiException('ADDRESS_NOT_FOUND', 'Address not found', 404)
      );

      await expect(addressService.update('nonexistent', mockUpdateRequest)).rejects.toThrow(ApiException);
    });
  });

  describe('delete', () => {
    it('should call DELETE /users/me/addresses/{addressId}', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ data: null, status: 204 });

      await addressService.delete('addr-1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/users/me/addresses/addr-1');
    });

    it('should return void (204 response has no body)', async () => {
      mockApiClient.delete.mockResolvedValueOnce({ data: null, status: 204 });

      const result = await addressService.delete('addr-1');

      expect(result).toBeUndefined();
    });

    it('should propagate ApiException on 404', async () => {
      mockApiClient.delete.mockRejectedValueOnce(
        new ApiException('ADDRESS_NOT_FOUND', 'Address not found', 404)
      );

      await expect(addressService.delete('nonexistent')).rejects.toThrow(ApiException);
    });

    it('should propagate ApiException on 409 DEFAULT_ADDRESS_CANNOT_BE_DELETED', async () => {
      mockApiClient.delete.mockRejectedValueOnce(
        new ApiException('DEFAULT_ADDRESS_CANNOT_BE_DELETED', 'Cannot delete default address', 409)
      );

      try {
        await addressService.delete('addr-1');
        fail('Expected ApiException to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiException);
        expect((e as ApiException).status).toBe(409);
        expect((e as ApiException).code).toBe('DEFAULT_ADDRESS_CANNOT_BE_DELETED');
      }
    });
  });
});
