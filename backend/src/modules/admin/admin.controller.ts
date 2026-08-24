import { Response, NextFunction, Request } from 'express';
import { adminService } from './admin.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { isCloudinaryConfigured, uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import prisma from '../../utils/prisma';

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

  // ── Hero Banner ──────────────────────────────────────────────────────
  async getHeroBanner(_req: Request, res: Response, next: NextFunction) {
    try {
      const setting = await prisma.siteSetting.findUnique({ where: { key: 'hero_banner' } });
      res.json({ success: true, data: setting ? JSON.parse(setting.value) : null });
    } catch (error) { next(error); }
  }

  async uploadHeroBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      const directUrl = (req.body?.url as string | undefined)?.trim();

      let imageUrl = '';
      let publicId = '';

      if (file) {
        if (isCloudinaryConfigured()) {
          const uploaded = await uploadToCloudinary(file.buffer, 'topthreadz-hero');
          imageUrl = uploaded.url;
          publicId = uploaded.publicId;
        } else {
          throw new Error('Cloudinary keys are missing on the backend. Please add Cloudinary keys or paste an Image URL.');
        }
      } else if (directUrl) {
        imageUrl = directUrl;
      } else {
        throw new Error('Please select an image file or enter a direct image URL.');
      }

      // Delete old banner from Cloudinary if exists
      try {
        const existing = await prisma.siteSetting.findUnique({ where: { key: 'hero_banner' } });
        if (existing) {
          try {
            const old = JSON.parse(existing.value);
            if (old.publicId) await deleteFromCloudinary(old.publicId);
          } catch { /* ignore parse errors */ }
        }
      } catch { /* ignore DB search errors */ }

      const payload = { url: imageUrl, publicId };

      try {
        await prisma.siteSetting.upsert({
          where: { key: 'hero_banner' },
          update: { value: JSON.stringify(payload) },
          create: { key: 'hero_banner', value: JSON.stringify(payload) },
        });
      } catch (dbErr) {
        logger.warn('Could not save hero banner to DB, returning payload to client', dbErr);
      }

      res.json({ success: true, data: payload });
    } catch (error) { next(error); }
  }

  async deleteHeroBanner(_req: Request, res: Response, next: NextFunction) {
    try {
      try {
        const existing = await prisma.siteSetting.findUnique({ where: { key: 'hero_banner' } });
        if (existing) {
          try {
            const old = JSON.parse(existing.value);
            if (old.publicId) await deleteFromCloudinary(old.publicId);
          } catch { /* ignore */ }
          await prisma.siteSetting.delete({ where: { key: 'hero_banner' } });
        }
      } catch { /* ignore */ }
      res.json({ success: true, data: null });
    } catch (error) { next(error); }
  }
}

export const adminController = new AdminController();
