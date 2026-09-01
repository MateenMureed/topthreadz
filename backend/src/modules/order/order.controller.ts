import { Response, NextFunction } from 'express';
import { orderService } from './order.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class OrderController {
  async createGuestOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.createGuestOrder(req.body);
      res.status(201).json({ success: true, data: order });
    } catch (error) { next(error); }
  }

  async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.createOrder(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: order });
    } catch (error) { next(error); }
  }

  async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await orderService.getOrders(req.user!.userId, page, limit);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getOrderById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getOrderById(req.user!.userId, req.params.id as string);
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  }

  async getDeliverySlots(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const slots = await orderService.getDeliverySlots();
      res.json({ success: true, data: slots });
    } catch (error) { next(error); }
  }

  async getTrackingByOrderNumber(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tracking = await orderService.getTrackingByReference(String(req.query.q || req.params.orderNumber || ''));
      res.json({ success: true, data: tracking });
    } catch (error) { next(error); }
  }

  async getTrackingByOrderId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tracking = await orderService.getTrackingByOrderId(req.user!.userId, req.params.id as string);
      res.json({ success: true, data: tracking });
    } catch (error) { next(error); }
  }

  async createReturnRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const request = await orderService.createReturnRequest(req.user!.userId, req.params.id as string, req.body);
      res.status(201).json({ success: true, data: request });
    } catch (error) { next(error); }
  }
}

export const orderController = new OrderController();
