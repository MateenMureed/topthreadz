import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';
import prisma from '../../utils/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import logger from '../../utils/logger';
import { env } from '../../config/env';
import { SafepayProvider } from './providers/safepay.provider';
import { PaymentContext } from './providers/provider.types';
import { orderService } from '../order/order.service';

const safepayProvider = new SafepayProvider();
const providerAliases: Record<string, PaymentMethod> = {
  safepay: 'SAFEPAY', card: 'SAFEPAY', cards: 'SAFEPAY', credit_card: 'SAFEPAY', debit_card: 'SAFEPAY',
  cod: 'COD', cash_on_delivery: 'COD', 'cash-on-delivery': 'COD',
};

export class PaymentService {
  private buildContext(order: { id: string; orderNumber: string; total: number; guestEmail?: string | null; guestPhone?: string | null; guestName?: string | null; address?: { phone: string | null; fullName: string | null } | null; user?: { email: string; name: string | null } | null }, method: string): PaymentContext {
    return { orderId: order.id, orderNumber: order.orderNumber, amount: order.total, method, customer: { email: order.guestEmail || order.user?.email || null, phone: order.guestPhone || order.address?.phone || null, name: order.guestName || order.address?.fullName || order.user?.name || null } };
  }

  private metadata(existing: unknown, incoming: Record<string, unknown>) {
    return { ...(existing && typeof existing === 'object' && !Array.isArray(existing) ? existing as Record<string, unknown> : {}), ...incoming } as Prisma.InputJsonValue;
  }

  private frontendRedirect(orderId: string, status: string) {
    const base = env.FRONTEND_URL.endsWith('/') ? env.FRONTEND_URL : `${env.FRONTEND_URL}/`;
    const url = new URL('orders', base);
    url.searchParams.set('orderId', orderId);
    url.searchParams.set('paymentStatus', status);
    url.searchParams.set('provider', 'safepay');
    return url.toString();
  }

  async initiatePayment(orderId: string, method: string, userId?: string) {
    const normalized = providerAliases[String(method).trim().toLowerCase()] || String(method).trim().toUpperCase() as PaymentMethod;
    if (!Object.values(PaymentMethod).includes(normalized)) throw new BadRequestError('Invalid payment method');
    const order = userId
      ? await prisma.order.findFirst({ where: { id: orderId, userId }, include: { address: { select: { phone: true, fullName: true } }, user: { select: { email: true, name: true } } } })
      : await prisma.order.findFirst({ where: { id: orderId, isGuest: true }, include: { address: { select: { phone: true, fullName: true } }, user: { select: { email: true, name: true } } } });
    if (!order) throw new NotFoundError('Order not found');
    if (order.status !== 'PENDING') throw new BadRequestError('Order is not pending');
    const existing = await prisma.payment.findUnique({ where: { orderId } });
    if (existing?.status === 'VERIFIED') throw new BadRequestError('Order already paid');

    if (normalized === 'COD') {
      const transactionId = `COD-${order.orderNumber}`;
      const payment = await prisma.payment.upsert({ where: { orderId }, update: { method: 'COD', status: 'PENDING', transactionId, amount: order.total, metadata: this.metadata(existing?.metadata, { provider: 'COD', lastInitiatedAt: new Date().toISOString() }) }, create: { orderId, method: 'COD', status: 'PENDING', transactionId, amount: order.total, metadata: { provider: 'COD' } } });
      return { payment, success: true, transactionId, message: 'Cash on delivery order placed.' };
    }

    const context = this.buildContext(order, 'SAFEPAY');
    const result = await safepayProvider.initiatePayment(order.total, orderId, context);
    const safepayMetadata = { provider: 'SAFEPAY', checkout: result.checkout as unknown as Record<string, unknown>, providerMetadata: result.metadata || null, customer: context.customer || null };
    const payment = await prisma.payment.upsert({ where: { orderId }, update: { method: 'SAFEPAY', status: 'PENDING', transactionId: result.transactionId, amount: order.total, metadata: this.metadata(existing?.metadata, { ...safepayMetadata, lastInitiatedAt: new Date().toISOString() }) }, create: { orderId, method: 'SAFEPAY', status: 'PENDING', transactionId: result.transactionId, amount: order.total, metadata: this.metadata(null, safepayMetadata) } });
    return { payment, ...result };
  }

  async verifyPayment(orderId: string) {
    const payment = await prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundError('Payment not found');
    return { success: true, status: payment.status === 'VERIFIED' ? 'verified' as const : payment.status === 'FAILED' ? 'failed' as const : 'pending' as const, transactionId: payment.transactionId || '', message: payment.method === 'SAFEPAY' ? 'Payment is confirmed by Safepay webhook.' : 'Cash on delivery payment will be collected at delivery.' };
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string | undefined) {
    if (!env.SAFEPAY_WEBHOOK_SECRET) throw new Error('Safepay webhook is not configured. Set SAFEPAY_WEBHOOK_SECRET.');
    if (!signature) throw new BadRequestError('Missing Safepay webhook signature');
    const expected = crypto.createHmac('sha512', env.SAFEPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
    const received = signature.trim().toLowerCase();
    if (expected.length !== received.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))) throw new BadRequestError('Invalid Safepay webhook signature');
  }

  async handleSafepayWebhook(payload: Record<string, unknown>) {
    const data = (payload.data && typeof payload.data === 'object' ? payload.data : payload) as Record<string, unknown>;
    const trackerValue = data.tracker || data.tracker_token || data.token;
    const tracker = typeof trackerValue === 'string' ? trackerValue : (trackerValue as Record<string, unknown> | undefined)?.token as string | undefined;
    const metadata = (data.metadata && typeof data.metadata === 'object' ? data.metadata : {}) as Record<string, unknown>;
    const orderId = typeof data.order_id === 'string' ? data.order_id : typeof metadata.order_id === 'string' ? metadata.order_id : undefined;
    const event = String(payload.type || payload.event || data.type || data.status || '').toLowerCase();
    const payment = tracker ? await prisma.payment.findFirst({ where: { transactionId: tracker, method: 'SAFEPAY' } }) : orderId ? await prisma.payment.findFirst({ where: { orderId, method: 'SAFEPAY' } }) : null;
    if (!payment) throw new NotFoundError('Payment not found for Safepay webhook');
    const succeeded = event.includes('succeed') || event === 'paid' || event === 'completed';
    const failed = event.includes('fail') || event.includes('cancel') || event.includes('expire');
    const updateMetadata = this.metadata(payment.metadata, { safepayWebhook: payload, lastWebhookAt: new Date().toISOString() });

    if (succeeded && payment.status !== 'VERIFIED') {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'VERIFIED', verifiedAt: new Date(), metadata: updateMetadata } });
      await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });
      await orderService.decrementStockForOrder(payment.orderId);
      logger.info(`Safepay payment verified: ${payment.transactionId}`, { event: 'payment_webhook_verified' });
    } else if (failed && payment.status !== 'VERIFIED') {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', metadata: updateMetadata } });
    } else {
      await prisma.payment.update({ where: { id: payment.id }, data: { metadata: updateMetadata } });
    }
    return { received: true, orderId: payment.orderId };
  }

  async handleCallback() { return { redirectUrl: this.frontendRedirect('', 'pending') }; }

  async adminVerifyPayment(paymentId: string, adminId: string, approved: boolean) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundError('Payment not found');
    await prisma.payment.update({ where: { id: paymentId }, data: { status: approved ? 'VERIFIED' : 'FAILED', verifiedBy: adminId, verifiedAt: new Date(), metadata: this.metadata(payment.metadata, { adminReview: { adminId, approved, reviewedAt: new Date().toISOString() } }) } });
    if (approved && payment.status !== 'VERIFIED') {
      await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } });
      if (payment.method !== 'COD') await orderService.decrementStockForOrder(payment.orderId);
    }
    return { message: `Payment ${approved ? 'approved' : 'rejected'}` };
  }
}

export const paymentService = new PaymentService();
