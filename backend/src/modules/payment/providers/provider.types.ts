export interface HostedCheckoutPayload {
  type: 'form' | 'redirect';
  url: string;
  method?: 'GET' | 'POST';
  fields?: Record<string, string>;
}

export interface PaymentCustomerContext {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
}

export interface PaymentContext {
  orderId: string;
  orderNumber?: string;
  amount: number;
  method?: string;
  customer?: PaymentCustomerContext;
  metadata?: Record<string, unknown>;
}

export interface PaymentInitResponse {
  success: boolean;
  transactionId: string;
  redirectUrl?: string;
  checkout?: HostedCheckoutPayload;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentVerifyResponse {
  success: boolean;
  status: 'verified' | 'pending' | 'failed';
  transactionId: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentProvider {
  name: string;
  initiatePayment(amount: number, orderId: string, context?: PaymentContext): Promise<PaymentInitResponse>;
  verifyPayment(transactionId: string, context?: PaymentContext): Promise<PaymentVerifyResponse>;
  handleCallback?(payload: Record<string, unknown>, context?: PaymentContext): Promise<PaymentVerifyResponse>;
}
