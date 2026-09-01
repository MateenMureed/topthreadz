import api from './api';

interface CreateOrderInput {
  addressId: string;
  notes?: string;
  couponCode?: string;
  deliverySlotId?: string;
  deliveryDate?: string;
}

interface CreateGuestOrderInput {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  address: { fullName: string; phone: string; address: string; city: string; province: string };
  items: Array<{ productId: string; quantity: number; size?: string; color?: string }>;
}

interface ReturnRequestInput {
  orderItemId?: string;
  type: 'RETURN' | 'EXCHANGE';
  reason: string;
  refundAmount?: number;
}

export const orderService = {
  createGuest: (data: CreateGuestOrderInput) => api.post('/orders/guest', data).then(r => r.data),
  create: (data: CreateOrderInput) => {
    const payload: CreateOrderInput = {
      addressId: String(data.addressId || '').trim(),
    };

    const notes = data.notes?.trim();
    const couponCode = data.couponCode?.trim();
    const deliverySlotId = data.deliverySlotId?.trim();
    const deliveryDate = data.deliveryDate?.trim();

    if (notes) payload.notes = notes;
    if (couponCode) payload.couponCode = couponCode;
    if (deliverySlotId) payload.deliverySlotId = deliverySlotId;
    if (deliveryDate) payload.deliveryDate = deliveryDate;

    return api.post('/orders', payload).then(r => r.data);
  },

  getAll: (page = 1, limit = 10) =>
    api.get('/orders', { params: { page, limit } }).then(r => r.data),

  getById: (id: string) =>
    api.get(`/orders/${id}`).then(r => r.data),

  getTrackingByReference: (reference: string) =>
    api.get('/orders/tracking/lookup', { params: { q: reference } }).then(r => r.data),

  getTrackingByOrderId: (id: string) =>
    api.get(`/orders/${id}/tracking`).then(r => r.data),

  getDeliverySlots: () =>
    api.get('/orders/delivery-slots').then(r => r.data),

  createReturnRequest: (orderId: string, data: ReturnRequestInput) =>
    api.post(`/orders/${orderId}/returns`, data).then(r => r.data),
};

export const paymentService = {
  initiate: (data: { orderId: string; method: 'SAFEPAY' | 'COD' }) =>
    api.post('/payments/initiate', data).then(r => r.data),

  initiateGuest: (data: { orderId: string; method: 'SAFEPAY' | 'COD' }) =>
    api.post('/payments/initiate-guest', data).then(r => r.data),

  verify: (orderId: string) =>
    api.get(`/payments/verify/${orderId}`).then(r => r.data),
};
