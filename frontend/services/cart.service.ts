import api from './api';

export const cartService = {
  getCart: () =>
    api.get('/cart').then(r => r.data),

  addItem: (data: { productId: string; quantity: number; size?: string; color?: string }) => {
    const payload: { productId: string; quantity: number; size?: string; color?: string } = {
      productId: String(data.productId || '').trim(),
      quantity: Number(data.quantity),
    };
    const size = data.size?.trim();
    const color = data.color?.trim();
    if (size) payload.size = size;
    if (color) payload.color = color;
    return api.post('/cart/items', payload).then(r => r.data);
  },

  updateItem: (itemId: string, quantity: number) =>
    api.patch(`/cart/items/${itemId}`, { quantity }).then(r => r.data),

  removeItem: (itemId: string) =>
    api.delete(`/cart/items/${itemId}`).then(r => r.data),

  clearCart: () =>
    api.delete('/cart').then(r => r.data),
};
