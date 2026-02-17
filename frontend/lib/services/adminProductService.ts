import { apiClient } from '../api/client';
import type { components, operations } from '../api/types';

type Product = components['schemas']['Product'];
type ProductListResponse = components['schemas']['ProductListResponse'];
type ListProductsParams = NonNullable<operations['listProducts']['parameters']['query']>;

export const adminProductService = {
  /**
   * List products with optional filtering. Returns the full ProductListResponse (data + meta).
   * Supports isActive filter for admin/staff to see inactive products.
   */
  async list(params?: ListProductsParams): Promise<ProductListResponse> {
    const cleanParams = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))
      : {};
    const response = await apiClient.get<ProductListResponse>('/products', {
      params: cleanParams,
    });
    return response.data;
  },

  /**
   * Activate a product (MANAGER/ADMIN only).
   */
  async activate(productId: string): Promise<Product> {
    const response = await apiClient.post<{ data: Product }>(
      `/products/${productId}/activate`
    );
    return response.data.data;
  },

  /**
   * Deactivate a product (MANAGER/ADMIN only).
   */
  async deactivate(productId: string): Promise<Product> {
    const response = await apiClient.post<{ data: Product }>(
      `/products/${productId}/deactivate`
    );
    return response.data.data;
  },

  /**
   * Soft-delete a product (MANAGER/ADMIN only). Returns void (204 response).
   */
  async delete(productId: string): Promise<void> {
    await apiClient.delete(`/products/${productId}`);
  },
};
