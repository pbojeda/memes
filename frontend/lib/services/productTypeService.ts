import { apiClient } from '../api/client';
import type { components } from '../api/types';

type ProductType = components['schemas']['ProductType'];
type CreateProductTypeRequest = components['schemas']['CreateProductTypeRequest'];
type UpdateProductTypeRequest = components['schemas']['UpdateProductTypeRequest'];

export const productTypeService = {
  /**
   * List all product types, optionally filtered by active status.
   */
  async getAll(params?: { isActive?: boolean }): Promise<ProductType[]> {
    const response = await apiClient.get<{ data: ProductType[] }>('/product-types', {
      params: params ?? {},
    });
    return response.data.data;
  },

  /**
   * Create a new product type (Admin only).
   */
  async create(data: CreateProductTypeRequest): Promise<ProductType> {
    const response = await apiClient.post<{ data: ProductType }>('/product-types', data);
    return response.data.data;
  },

  /**
   * Update an existing product type (Admin only).
   */
  async update(id: string, data: UpdateProductTypeRequest): Promise<ProductType> {
    const response = await apiClient.patch<{ data: ProductType }>(
      `/product-types/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete a product type (Admin only).
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/product-types/${id}`);
  },
};
