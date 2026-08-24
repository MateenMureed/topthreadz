import api from './api';

export interface ProductQuery {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minDiscount?: number;
  size?: string;
  color?: string;
  subcategory?: string;
  brand?: string;
  collection?: string;
  gender?: string;
  productStatus?: string;
  visibility?: string;
  stockStatus?: string;
  search?: string;
  sortBy?: string;
}

export interface AiSearchQuery {
  q: string;
  page?: number;
  limit?: number;
}

interface ProductImageMetaInput {
  url: string;
  publicId?: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface UploadedProductImage {
  url: string;
  publicId: string;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  discount: number;
  category: string;
  subcategory?: string;
  brand?: string;
  collection?: string;
  gender?: 'MALE';
  sizes: string[];
  colors: string[];
  images: string[];
  stockStatus?: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER';
  lowStockThreshold?: number;
  stock: number;
  sku?: string;
  careInstructions?: string;
  featured?: boolean;
  trending?: boolean;
  productStatus?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  visibility?: 'PUBLIC';
  tags: string[];
  slug?: string;
  imageMeta?: ProductImageMetaInput[];
}

export const productService = {
  getAll: (params?: ProductQuery) =>
    api.get('/products', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get(`/products/${id}`).then(r => r.data),

  getBySlug: (slug: string) =>
    api.get(`/products/slug/${slug}`).then(r => r.data),

  getCategories: () =>
    api.get('/products/categories').then(r => r.data),

  getSuggestions: (q: string) =>
    api.get('/products/suggestions', { params: { q } }).then(r => r.data),

  aiSearch: (params: AiSearchQuery) =>
    api.get('/products/ai-search', { params }).then(r => r.data),

  recordView: (id: string) =>
    api.post(`/products/${id}/view`).then(r => r.data),

  getSimilar: (id: string) =>
    api.get(`/products/${id}/similar`).then(r => r.data),

  getUpsell: (id: string) =>
    api.get(`/products/${id}/upsell`).then(r => r.data),

  getRecommendations: () =>
    api.get('/recommendations').then(r => r.data),

  create: (data: ProductInput) => api.post('/products', data).then(r => r.data),

  update: (id: string, data: Partial<ProductInput>) => api.patch(`/products/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/products/${id}`).then(r => r.data),

  uploadImages: async (files: File[]): Promise<UploadedProductImage[]> => {
    const results: UploadedProductImage[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('images', file);
      const res = await api.post('/products/upload-images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const images: UploadedProductImage[] = res.data?.data?.images || [];
      results.push(...images);
    }
    return results;
  },
};
