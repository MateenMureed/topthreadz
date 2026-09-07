import api from './api';

export interface CustomerReview {
  id: string;
  userName: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerifiedBuyer?: boolean;
  createdAt: string;
  product?: {
    name: string;
    slug: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  breakdown: Record<number, number>;
}

export interface ProductReviewsResponse {
  reviews: CustomerReview[];
  stats: ReviewStats;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalReviews: number;
  };
}

export interface CreateReviewPayload {
  rating: number;
  title?: string;
  comment?: string;
  userName?: string;
  userEmail?: string;
}

export const reviewService = {
  async getProductReviews(productId: string, page = 1, limit = 10): Promise<ProductReviewsResponse> {
    const res = await api.get(`/products/${encodeURIComponent(productId)}/reviews`, {
      params: { page, limit },
    });
    return res.data?.data || {
      reviews: [],
      stats: { averageRating: 0, totalReviews: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
      pagination: { page: 1, limit: 10, totalPages: 0, totalReviews: 0 },
    };
  },

  async createReview(productId: string, payload: CreateReviewPayload) {
    const res = await api.post(`/products/${encodeURIComponent(productId)}/reviews`, payload);
    return res.data;
  },

  async getFeaturedReviews(): Promise<CustomerReview[]> {
    const res = await api.get('/products/reviews/featured');
    return res.data?.data || [];
  },
};
