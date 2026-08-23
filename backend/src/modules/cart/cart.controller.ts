import { Response, NextFunction } from 'express';
import { cartService } from './cart.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class CartController {
  async getCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.getCart(req.user!.userId);
      res.json({ success: true, data: cart });
    } catch (error) { next(error); }
  }

  async addItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.addItem(req.user!.userId, req.body);
      res.json({ success: true, data: cart });
    } catch (error) { next(error); }
  }

  async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.updateItem(req.user!.userId, req.params.itemId as string, req.body.quantity);
      res.json({ success: true, data: cart });
    } catch (error) { next(error); }
  }

  async removeItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cart = await cartService.removeItem(req.user!.userId, req.params.itemId as string);
      res.json({ success: true, data: cart });
    } catch (error) { next(error); }
  }

  async clearCart(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await cartService.clearCart(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export const cartController = new CartController();
