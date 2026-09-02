import { Response, NextFunction, Request } from 'express';
import { adminService } from './admin.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { isCloudinaryConfigured, uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import prisma from '../../utils/prisma';
import logger from '../../utils/logger';

const DEFAULT_HERO_BANNER_TEXT = {
  heading: 'Shop Our Newest Collection',
  subheading: 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
  buttonText: 'Shop Now',
  buttonLink: '/products',
};

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

  async getHeroBannerText(_req: Request, res: Response, next: NextFunction) {
    try {
      const setting = await prisma.siteSetting.findUnique({ where: { key: 'hero_banner_text' } });
      const savedText = setting ? JSON.parse(setting.value) : {};
      res.json({ success: true, data: { ...DEFAULT_HERO_BANNER_TEXT, ...savedText } });
    } catch (error) { next(error); }
  }

  async updateHeroBannerText(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body || {};
      const data = {
        heading: typeof body.heading === 'string' && body.heading.trim() ? body.heading.trim() : DEFAULT_HERO_BANNER_TEXT.heading,
        subheading: typeof body.subheading === 'string' && body.subheading.trim() ? body.subheading.trim() : DEFAULT_HERO_BANNER_TEXT.subheading,
        buttonText: typeof body.buttonText === 'string' && body.buttonText.trim() ? body.buttonText.trim() : DEFAULT_HERO_BANNER_TEXT.buttonText,
        buttonLink: typeof body.buttonLink === 'string' && body.buttonLink.startsWith('/') ? body.buttonLink.trim() : DEFAULT_HERO_BANNER_TEXT.buttonLink,
      };
      await prisma.siteSetting.upsert({
        where: { key: 'hero_banner_text' },
        update: { value: JSON.stringify(data) },
        create: { key: 'hero_banner_text', value: JSON.stringify(data) },
      });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async listHeroBanners(req: Request, res: Response, next: NextFunction) {
    try {
      const banners = await prisma.heroBanner.findMany({ where: { isActive: true }, orderBy: { position: 'asc' } });
      res.json({ success: true, data: banners });
    } catch (error) { next(error); }
  }

  async listAdminHeroBanners(_req: Request, res: Response, next: NextFunction) {
    try { res.json({ success: true, data: await prisma.heroBanner.findMany({ orderBy: { position: 'asc' } }) }); }
    catch (error) { next(error); }
  }

  async createHeroBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      const directUrl = String(req.body?.url || '').trim();
      let imageUrl = directUrl; let publicId: string | undefined;
      if (file) {
        if (!isCloudinaryConfigured()) throw new Error('Cloudinary keys are required for banner uploads.');
        const uploaded = await uploadToCloudinary(file.buffer, 'topthreadz-hero'); imageUrl = uploaded.url; publicId = uploaded.publicId;
      }
      if (!imageUrl) throw new Error('Select a banner image or provide an image URL.');
      const banner = await prisma.heroBanner.create({ data: {
        imageUrl, publicId, link: String(req.body?.link || '/products').trim() || '/products',
        position: Number(req.body?.position || 0), isActive: String(req.body?.isActive ?? 'true') !== 'false',
        altText: String(req.body?.altText || 'Top Threadz collection').trim() || 'Top Threadz collection',
      } });
      res.status(201).json({ success: true, data: banner });
    } catch (error) { next(error); }
  }

  async updateHeroBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const existing = await prisma.heroBanner.findUnique({ where: { id } });
      if (!existing) throw new Error('Banner not found');
      const file = (req as any).file as Express.Multer.File | undefined;
      const data: any = {};
      if (file) {
        if (!isCloudinaryConfigured()) throw new Error('Cloudinary keys are required for banner uploads.');
        const uploaded = await uploadToCloudinary(file.buffer, 'topthreadz-hero'); data.imageUrl = uploaded.url; data.publicId = uploaded.publicId;
        if (existing.publicId) void deleteFromCloudinary(existing.publicId);
      }
      for (const key of ['link', 'altText']) if (req.body?.[key] !== undefined) data[key] = String(req.body[key]).trim();
      if (req.body?.position !== undefined) data.position = Number(req.body.position);
      if (req.body?.isActive !== undefined) data.isActive = String(req.body.isActive) !== 'false';
      const banner = await prisma.heroBanner.update({ where: { id }, data });
      res.json({ success: true, data: banner });
    } catch (error) { next(error); }
  }

  async removeHeroBanner(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const banner = await prisma.heroBanner.delete({ where: { id } });
      if (banner.publicId) void deleteFromCloudinary(banner.publicId);
      res.json({ success: true, data: { id: banner.id } });
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

  // ── Store Settings ──────────────────────────────────────────────────
  async getStoreSettings(_req: Request, res: Response, next: NextFunction) {
    const DEFAULT_STORE_SETTINGS = {
      whatsappNumber: '923009070520',
      phoneNumber: '+92 300 1234567',
      email: 'support@topthreadz.pk',
      operatingDays: 'Mon to Fri: 9:00 AM - 6:00 PM',
      address: 'topthreadz, R28V+R3W, Street 2, DHA Phase 5 Zamzama Commercial Area Defence V Karachi, 75600, Pakistan',
      standardDeliveryFee: 250,
      freeDeliveryThreshold: 10000,
      privacyPolicy: '',
      termsOfService: '',
      deliveryPolicy: '',
      exchangeReturnPolicy: '',
      homepageHeading: 'Shop Our Collection',
      homepageSubheading: 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
      homepageGridCols: 4,
    };
    try {
      const setting = await prisma.siteSetting.findUnique({ where: { key: 'store_settings' } });
      const data = setting ? { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(setting.value) } : DEFAULT_STORE_SETTINGS;
      res.json({ success: true, data });
    } catch (error) {
      res.json({ success: true, data: DEFAULT_STORE_SETTINGS });
    }
  }

  async updateStoreSettings(req: Request, res: Response, next: NextFunction) {
    const DEFAULT_STORE_SETTINGS = {
      whatsappNumber: '923009070520',
      phoneNumber: '+92 300 1234567',
      email: 'support@topthreadz.pk',
      operatingDays: 'Mon to Fri: 9:00 AM - 6:00 PM',
      address: 'topthreadz, R28V+R3W, Street 2, DHA Phase 5 Zamzama Commercial Area Defence V Karachi, 75600, Pakistan',
      standardDeliveryFee: 250,
      freeDeliveryThreshold: 10000,
      privacyPolicy: '',
      termsOfService: '',
      deliveryPolicy: '',
      exchangeReturnPolicy: '',
      homepageHeading: 'Shop Our Collection',
      homepageSubheading: 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
      homepageGridCols: 4,
    };
    try {
      const body = req.body || {};
      const payload = {
        whatsappNumber: body.whatsappNumber !== undefined && body.whatsappNumber !== null ? String(body.whatsappNumber).trim() : DEFAULT_STORE_SETTINGS.whatsappNumber,
        phoneNumber: body.phoneNumber !== undefined && body.phoneNumber !== null ? String(body.phoneNumber).trim() : DEFAULT_STORE_SETTINGS.phoneNumber,
        email: body.email !== undefined && body.email !== null ? String(body.email).trim() : DEFAULT_STORE_SETTINGS.email,
        operatingDays: body.operatingDays !== undefined && body.operatingDays !== null ? String(body.operatingDays).trim() : DEFAULT_STORE_SETTINGS.operatingDays,
        address: body.address !== undefined && body.address !== null ? String(body.address).trim() : DEFAULT_STORE_SETTINGS.address,
        standardDeliveryFee: Number.isFinite(Number(body.standardDeliveryFee)) && Number(body.standardDeliveryFee) >= 0 ? Number(body.standardDeliveryFee) : DEFAULT_STORE_SETTINGS.standardDeliveryFee,
        freeDeliveryThreshold: Number.isFinite(Number(body.freeDeliveryThreshold)) && Number(body.freeDeliveryThreshold) >= 0 ? Number(body.freeDeliveryThreshold) : DEFAULT_STORE_SETTINGS.freeDeliveryThreshold,
        privacyPolicy: body.privacyPolicy || '',
        termsOfService: body.termsOfService || '',
        deliveryPolicy: body.deliveryPolicy || '',
        exchangeReturnPolicy: body.exchangeReturnPolicy || '',
        homepageHeading: body.homepageHeading !== undefined && body.homepageHeading !== null ? String(body.homepageHeading).trim() : DEFAULT_STORE_SETTINGS.homepageHeading,
        homepageSubheading: body.homepageSubheading !== undefined && body.homepageSubheading !== null ? String(body.homepageSubheading).trim() : DEFAULT_STORE_SETTINGS.homepageSubheading,
        homepageGridCols: [2, 3, 4].includes(Number(body.homepageGridCols)) ? Number(body.homepageGridCols) : DEFAULT_STORE_SETTINGS.homepageGridCols,
      };

      await prisma.siteSetting.upsert({
        where: { key: 'store_settings' },
        update: { value: JSON.stringify(payload) },
        create: { key: 'store_settings', value: JSON.stringify(payload) },
      });

      res.json({ success: true, data: payload });
    } catch (error) { next(error); }
  }
}

export const adminController = new AdminController();

