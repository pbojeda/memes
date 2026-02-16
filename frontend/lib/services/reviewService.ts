import { apiClient } from '../api/client';
import type { components, operations } from '../api/types';

type ReviewListResponse = components['schemas']['ReviewListResponse'];
type ListReviewsParams = operations['listProductReviews']['parameters']['query'];

export const reviewService = {
  async list(
    productId: string,
    params?: ListReviewsParams
  ): Promise<ReviewListResponse> {
    const cleanParams = params
      ? Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined)
        )
      : {};

    const response = await apiClient.get<ReviewListResponse>(
      `/products/${productId}/reviews`,
      { params: cleanParams }
    );

    return response.data;
  },
};
