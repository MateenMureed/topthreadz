import api from './api';

export type AnalyticsEventType =
  | 'SEARCH'
  | 'PRODUCT_VIEW'
  | 'ADD_TO_CART'
  | 'BEGIN_CHECKOUT'
  | 'PURCHASE'
  | 'CART_ABANDON'
  | 'PAGE_VIEW'
  | 'QUICK_VIEW'
  | 'COMPARE'
  | 'WISHLIST';

interface SaveForLaterInput {
  productId: string;
  quantity?: number;
  size?: string;
  color?: string;
}

export const experienceService = {
  getWishlist: () => api.get('/experience/wishlist').then((r) => r.data),

  toggleWishlist: (productId: string) =>
    api.post(`/experience/wishlist/${productId}`).then((r) => r.data),

  getCompare: () => api.get('/experience/compare').then((r) => r.data),

  addToCompare: (productId: string) =>
    api.post(`/experience/compare/${productId}`).then((r) => r.data),

  removeFromCompare: (productId: string) =>
    api.delete(`/experience/compare/${productId}`).then((r) => r.data),

  getSavedForLater: () => api.get('/experience/saved-for-later').then((r) => r.data),

  saveForLater: (payload: SaveForLaterInput) =>
    api.post('/experience/saved-for-later', payload).then((r) => r.data),

  removeSavedForLater: (itemId: string) =>
    api.delete(`/experience/saved-for-later/${itemId}`).then((r) => r.data),

  getRecentlyViewed: () => api.get('/experience/recently-viewed').then((r) => r.data),

  trackEvent: (
    type: AnalyticsEventType,
    metadata?: Record<string, unknown>,
    page?: string,
    sessionId?: string,
  ) =>
    api
      .post('/experience/analytics/events', {
        type,
        metadata,
        page,
        sessionId,
      })
      .then((r) => r.data),
};
