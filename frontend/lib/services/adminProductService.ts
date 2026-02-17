import { apiClient } from '../api/client';
import type { components, operations } from '../api/types';

type Product = components['schemas']['Product'];
type ProductImage = components['schemas']['ProductImage'];
type ProductListResponse = components['schemas']['ProductListResponse'];
type ListProductsParams = NonNullable<operations['listProducts']['parameters']['query']>;
type CreateProductRequest = components['schemas']['CreateProductRequest'];
type UpdateProductRequest = components['schemas']['UpdateProductRequest'];
type CreateProductImageRequest = components['schemas']['CreateProductImageRequest'];
type UpdateProductImageRequest = components['schemas']['UpdateProductImageRequest'];

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

  /**
   * Get a single product by ID (MANAGER/ADMIN only).
   */
  async getById(productId: string): Promise<Product> {
    const response = await apiClient.get<{ data: Product }>(`/products/${productId}`);
    return response.data.data;
  },

  /**
   * Create a new product (MANAGER/ADMIN only).
   */
  async create(data: CreateProductRequest): Promise<Product> {
    const response = await apiClient.post<{ data: Product }>('/products', data);
    return response.data.data;
  },

  /**
   * Update a product (MANAGER/ADMIN only).
   */
  async update(productId: string, data: UpdateProductRequest): Promise<Product> {
    const response = await apiClient.patch<{ data: Product }>(
      `/products/${productId}`,
      data
    );
    return response.data.data;
  },

  /**
   * List images for a product (MANAGER/ADMIN only).
   */
  async listImages(productId: string): Promise<ProductImage[]> {
    const response = await apiClient.get<{ data: ProductImage[] }>(
      `/products/${productId}/images`
    );
    return response.data.data;
  },

  /**
   * Add an image to a product (MANAGER/ADMIN only).
   */
  async addImage(productId: string, data: CreateProductImageRequest): Promise<ProductImage> {
    const response = await apiClient.post<{ data: ProductImage }>(
      `/products/${productId}/images`,
      data
    );
    return response.data.data;
  },

  /**
   * Update an image on a product (MANAGER/ADMIN only).
   */
  async updateImage(
    productId: string,
    imageId: string,
    data: UpdateProductImageRequest
  ): Promise<ProductImage> {
    const response = await apiClient.patch<{ data: ProductImage }>(
      `/products/${productId}/images/${imageId}`,
      data
    );
    return response.data.data;
  },

  /**
   * Delete an image from a product (MANAGER/ADMIN only).
   */
  async deleteImage(productId: string, imageId: string): Promise<void> {
    await apiClient.delete(`/products/${productId}/images/${imageId}`);
  },
};
