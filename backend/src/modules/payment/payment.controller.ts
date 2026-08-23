import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class PaymentController {
  async initiatePayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const orderId = String(req.body?.orderId || '').trim();
      const method = String(req.body?.method || '').trim().toUpperCase();

      if (!orderId || !method) {
        res.status(400).json({ success: false, error: 'orderId and method are required' });
        return;
      }

      const result = await paymentService.initiatePayment(orderId, method, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async initiateGuestPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = String(req.body?.orderId || '').trim();
      const method = String(req.body?.method || '').trim().toUpperCase();
      if (!orderId || !method) {
        res.status(400).json({ success: false, error: 'orderId and method are required' });
        return;
      }
      const result = await paymentService.initiatePayment(orderId, method);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await paymentService.verifyPayment(req.params.orderId as string);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.params.provider !== 'safepay') {
        res.status(404).json({ success: false, error: 'Unknown payment provider' });
        return;
      }
      const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
      if (!rawBody) throw new Error('Raw webhook body is unavailable');
      paymentService.verifyWebhookSignature(rawBody, req.header('X-SFPY-SIGNATURE') || undefined);
      const result = await paymentService.handleSafepayWebhook(req.body || {});
      res.json(result);
    } catch (error) { next(error); }
  }

  async handleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.params.provider !== 'safepay') {
        res.status(404).json({ success: false, error: 'Unknown payment provider' });
        return;
      }
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders`);
    } catch (error) { next(error); }
  }
}

export const paymentController = new PaymentController();
