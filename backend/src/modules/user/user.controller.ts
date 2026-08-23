import { Response, NextFunction } from 'express';
import { userService } from './user.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class UserController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.getProfile(req.user!.userId);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await userService.updateProfile(req.user!.userId, req.body);
      res.json({ success: true, data: user });
    } catch (error) { next(error); }
  }

  async addAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const address = await userService.addAddress(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: address });
    } catch (error) { next(error); }
  }

  async updateAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const address = await userService.updateAddress(req.user!.userId, req.params.addressId as string, req.body);
      res.json({ success: true, data: address });
    } catch (error) { next(error); }
  }

  async deleteAddress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await userService.deleteAddress(req.user!.userId, req.params.addressId as string);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getAddresses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const addresses = await userService.getAddresses(req.user!.userId);
      res.json({ success: true, data: addresses });
    } catch (error) { next(error); }
  }
}

export const userController = new UserController();
