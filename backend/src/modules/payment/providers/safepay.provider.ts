import axios from 'axios';
import { env } from '../../../config/env';
import logger from '../../../utils/logger';
import { PaymentContext, PaymentInitResponse, PaymentProvider, PaymentVerifyResponse } from './provider.types';

type SafepayTrackerResponse = {
  data?: { tracker?: { token?: string } };
  tracker?: { token?: string };
};

export class SafepayProvider implements PaymentProvider {
  readonly name = 'SAFEPAY';

  private get apiBaseUrl() {
    return env.SAFEPAY_ENVIRONMENT === 'production'
      ? 'https://api.getsafepay.com'
      : 'https://sandbox.api.getsafepay.com';
  }

  private get checkoutBaseUrl() {
    return env.SAFEPAY_ENVIRONMENT === 'production'
      ? 'https://getsafepay.com'
      : 'https://sandbox.api.getsafepay.com';
  }

  private assertConfigured() {
    if (!env.SAFEPAY_API_KEY) {
      throw new Error('Safepay is not configured. Set SAFEPAY_API_KEY.');
    }
  }

  async initiatePayment(amount: number, orderId: string, context?: PaymentContext): Promise<PaymentInitResponse> {
    this.assertConfigured();
    const amountInMinorUnits = Math.round(amount * 100);
    const response = await axios.post<SafepayTrackerResponse>(
      `${this.apiBaseUrl}/order/payments/v3/`,
      {
        merchant_api_key: env.SAFEPAY_API_KEY,
        intent: 'CYBERSOURCE',
        mode: 'payment',
        entry_mode: 'flex',
        currency: env.SAFEPAY_CURRENCY,
        amount: amountInMinorUnits,
        metadata: { order_id: orderId, order_number: context?.orderNumber || orderId },
      },
      { headers: { Authorization: `Bearer ${env.SAFEPAY_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );

    const tracker = response.data?.data?.tracker?.token || response.data?.tracker?.token;
    if (!tracker) throw new Error('Safepay did not return a tracker token.');

    const redirectUrl = new URL('/checkout/pay', this.checkoutBaseUrl);
    redirectUrl.searchParams.set('tracker', tracker);
    redirectUrl.searchParams.set('source', 'hosted');
    redirectUrl.searchParams.set('redirect_url', `${env.BACKEND_PUBLIC_URL}/api/payments/callback/safepay`);
    redirectUrl.searchParams.set('cancel_url', `${env.BACKEND_PUBLIC_URL}/api/payments/callback/safepay`);

    logger.info(`Safepay tracker created for order ${orderId}`, { provider: this.name, tracker });
    return {
      success: true,
      transactionId: tracker,
      redirectUrl: redirectUrl.toString(),
      checkout: { type: 'redirect', url: redirectUrl.toString(), method: 'GET' },
      message: 'Redirecting to Safepay secure checkout.',
      metadata: { tracker, amountInMinorUnits, currency: env.SAFEPAY_CURRENCY },
    };
  }

  async verifyPayment(transactionId: string): Promise<PaymentVerifyResponse> {
    return { success: true, status: 'pending', transactionId, message: 'Payment status is confirmed by the Safepay webhook.' };
  }
}
