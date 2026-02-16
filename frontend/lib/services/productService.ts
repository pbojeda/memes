import { apiClient } from '../api/client';
import type { components, operations } from '../api/types';

type ProductListResponse = components['schemas']['ProductListResponse'];
type ListProductsParams = operations['listProducts']['parameters']['query'];

export const productService = {
  /**
   * List products with optional filtering, search, and pagination.
   */
  async list(params?: ListProductsParams): Promise<ProductListResponse> {
    // Remove undefined params to avoid sending them to the API
    const cleanParams = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))
      : {};

    const response = await apiClient.get<ProductListResponse>('/products', {
      params: cleanParams,
    });

    return response.data;
  },
};
