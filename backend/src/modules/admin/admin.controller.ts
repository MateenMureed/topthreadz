import { Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export class AdminController {
  async getDashboard(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  }

  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await adminService.getUsers(page);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.updateUserRole(req.params.id as string, req.body.role, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async unlockUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.unlockUser(req.params.id as string, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const status = (req.query.status as string | undefined)?.trim();
      const paymentStatus = (req.query.paymentStatus as string | undefined)?.trim();
      const search = (req.query.search as string | undefined)?.trim();

      const result = await adminService.getOrders(page, 20, {
        status: status || undefined,
        paymentStatus: paymentStatus || undefined,
        search: search || undefined,
      });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.updateOrderStatus(req.params.id as string, req.body.status, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getPendingPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await adminService.getPendingPayments(page);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.verifyPayment(req.params.id as string, req.user!.userId, req.body.approved);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const result = await adminService.getAuditLogs(page);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async cleanupLegacyData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.cleanupLegacyData(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export const adminController = new AdminController();
