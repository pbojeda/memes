import { apiClient } from '../api/client';
import type { components } from '../api/types';

type Address = components['schemas']['Address'];
type CreateAddressRequest = components['schemas']['CreateAddressRequest'];
type UpdateAddressRequest = components['schemas']['UpdateAddressRequest'];

export const addressService = {
  /**
   * List all addresses for the authenticated user.
   */
  async list(): Promise<Address[]> {
    const response = await apiClient.get<{ data: Address[] }>('/users/me/addresses');
    return response.data.data;
  },

  /**
   * Create a new address for the authenticated user.
   */
  async create(data: CreateAddressRequest): Promise<Address> {
    const response = await apiClient.post<{ data: Address }>('/users/me/addresses', data);
    return response.data.data;
  },

  /**
   * Update an existing address for the authenticated user.
   */
  async update(addressId: string, data: UpdateAddressRequest): Promise<Address> {
    const response = await apiClient.patch<{ data: Address }>(
      `/users/me/addresses/${addressId}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete an address for the authenticated user. Returns void (204 response).
   */
  async delete(addressId: string): Promise<void> {
    await apiClient.delete(`/users/me/addresses/${addressId}`);
  },
};
