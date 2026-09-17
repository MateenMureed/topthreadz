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

/**
 * Insert an on-the-fly transformation into a Cloudinary delivery URL.
 * Cloudinary syntax: .../image/upload/<transformation>/<version>/<path>.jpg
 *   https://res.cloudinary.com/<cloud>/image/upload/v123/logo.jpg
 *     + c_limit,h_96  ->  .../image/upload/c_limit,h_96,q_auto:good,f_auto/v123/logo.jpg
 * The transformation goes BEFORE the version segment. Non-Cloudinary URLs
 * are returned unchanged.
 */
function insertCloudinaryTransform(url: string, transformation: string): string {
  const marker = '/image/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const base = url.slice(0, idx + marker.length);
  const rest = url.slice(idx + marker.length);
  return `${base}${transformation}/${rest}`;
}

// ── Site logo slots ──────────────────────────────────────────────────────
// Each slot is uploaded separately by the admin (dark-mode logo, light-mode
// logo, footer logo, favicon). Auto-resize derives the needed dimensions via
// Cloudinary transformations — nothing else is altered.
type LogoSlot = 'dark' | 'light' | 'footer' | 'favicon';
const LOGO_SLOTS: LogoSlot[] = ['dark', 'light', 'footer', 'favicon'];

/** Per-slot display sizes (height in px). */
const LOGO_SLOT_SIZES: Record<LogoSlot, { header: number; footer: number; small: number }> = {
  dark: { header: 96, footer: 64, small: 48 },
  light: { header: 96, footer: 64, small: 48 },
  footer: { header: 96, footer: 64, small: 48 },
  favicon: { header: 96, footer: 64, small: 48 },
};

/**
 * Build the public logo payload from stored slots. Each slot provides:
 *  - url:   canonical upload
 *  - header / footer / small: auto-resized Cloudinary variants
 * The favicon slot additionally provides .ico and .png entries for broad
 * browser compatibility (Cloudinary's f_icl converts to ICO on the fly).
 * Legacy single-logo storage is mapped into the dark slot for compatibility.
 */
function normalizeLogoPayload(stored: any) {
  const slotsIn = stored?.slots || (stored?.url ? { dark: { url: stored.url, publicId: stored.publicId } } : {});

  const build = (slot: LogoSlot) => {
    const entry = slotsIn[slot];
    if (!entry?.url) return null;
    const sizes = LOGO_SLOT_SIZES[slot];
    const variant = (height: number) =>
      insertCloudinaryTransform(entry.url, `c_limit,h_${height},q_auto:good,f_auto`);
    return {
      url: entry.url,
      publicId: entry.publicId || '',
      header: variant(sizes.header),
      footer: variant(sizes.footer),
      small: variant(sizes.small),
    };
  };

  const dark = build('dark');
  const light = build('light');
  const footer = build('footer');
  const favicon = build('favicon');

  return {
    // Primary convenience fields: dark-mode header logo (uploaded separately)
    url: dark?.url || '',
    publicId: dark?.publicId || '',
    header: dark?.header || '',
    footerLogo: footer?.footer || dark?.footer || '',
    faviconUrl: favicon?.small || '',
    faviconPng: favicon
      ? insertCloudinaryTransform(favicon.url, 'c_limit,h_48,q_auto:good,f_png')
      : '',
    faviconIco: favicon
      ? insertCloudinaryTransform(favicon.url, 'c_limit,h_48,q_auto:good,f_ico')
      : '',
    dark,
    light,
    footer,
    favicon,
  };
}

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

  async deleteOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteOrder(req.params.id as string, req.user!.userId);
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

  // ── Admin Accounts (create/delete/list secondary admins) ──────────────
  async listAdmins(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const admins = await adminService.listAdmins();
      res.json({ success: true, data: admins });
    } catch (error) { next(error); }
  }

  async createAdminAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body || {};
      if (!name || !email || !password) {
        res.status(400).json({ success: false, error: 'Name, email and password are required.' });
        return;
      }
      const admin = await adminService.createAdmin({ name, email, password }, req.user!.userId);
      res.status(201).json({ success: true, data: admin });
    } catch (error) { next(error); }
  }

  async deleteAdminAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const targetId = String(req.params.id);
      const actingAdmin = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { email: true } });
      const result = await adminService.deleteAdmin(targetId, actingAdmin?.email || '');
      res.json({ success: true, data: result });
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

  // ── Mobile Hero Banner (portrait 1080×1350 for smartphones) ─────────────
  async uploadHeroBannerMobile(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      const directUrl = (req.body?.url as string | undefined)?.trim();

      let imageUrl = '';
      let publicId = '';

      if (file) {
        if (isCloudinaryConfigured()) {
          const uploaded = await uploadToCloudinary(file.buffer, 'topthreadz-hero-mobile');
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

      // Delete old mobile banner from Cloudinary if exists
      try {
        const existing = await prisma.siteSetting.findUnique({ where: { key: 'hero_banner_mobile' } });
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
          where: { key: 'hero_banner_mobile' },
          update: { value: JSON.stringify(payload) },
          create: { key: 'hero_banner_mobile', value: JSON.stringify(payload) },
        });
      } catch (dbErr) {
        logger.warn('Could not save mobile hero banner to DB, returning payload to client', dbErr);
      }

      res.json({ success: true, data: payload });
    } catch (error) { next(error); }
  }

  async deleteHeroBannerMobile(_req: Request, res: Response, next: NextFunction) {
    try {
      try {
        const existing = await prisma.siteSetting.findUnique({ where: { key: 'hero_banner_mobile' } });
        if (existing) {
          try {
            const old = JSON.parse(existing.value);
            if (old.publicId) await deleteFromCloudinary(old.publicId);
          } catch { /* ignore */ }
          await prisma.siteSetting.delete({ where: { key: 'hero_banner_mobile' } });
        }
      } catch { /* ignore */ }
      res.json({ success: true, data: null });
    } catch (error) { next(error); }
  }

  async getHeroBannerMobile(_req: Request, res: Response, next: NextFunction) {
    try {
      const setting = await prisma.siteSetting.findUnique({ where: { key: 'hero_banner_mobile' } });
      res.json({ success: true, data: setting ? JSON.parse(setting.value) : null });
    } catch (error) { next(error); }
  }


  // ── Site Logo (auto-resized variants for header/footer/favicon) ───────
  // The logo is uploaded once; Cloudinary transformation URLs generate
  // header/footer-sized and favicon-sized variants on demand. The stored
  // payload keeps the canonical URL + publicId so variants are derivable.

  async getSiteLogo(_req: Request, res: Response, next: NextFunction) {
    try {
      const setting = await prisma.siteSetting.findUnique({ where: { key: 'site_logo' } });
      if (!setting) {
        res.json({ success: true, data: null });
        return;
      }
      res.json({ success: true, data: normalizeLogoPayload(JSON.parse(setting.value)) });
    } catch (error) { next(error); }
  }

  async uploadSiteLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      const directUrl = (req.body?.url as string | undefined)?.trim();
      const slot = String(req.body?.slot || 'dark').toLowerCase();

      if (!LOGO_SLOTS.includes(slot as LogoSlot)) {
        throw new Error(`Invalid logo slot. Use one of: ${LOGO_SLOTS.join(', ')}.`);
      }

      let imageUrl = '';
      let publicId = '';

      if (file) {
        if (!isCloudinaryConfigured()) {
          throw new Error('Cloudinary keys are missing on the backend. Please add Cloudinary keys or paste an image URL.');
        }
        const uploaded = await uploadToCloudinary(file.buffer, 'topthreadz-logo');
        imageUrl = uploaded.url;
        publicId = uploaded.publicId;
      } else if (directUrl && /^https?:\/\//i.test(directUrl)) {
        imageUrl = directUrl;
      } else {
        throw new Error('Please select an image file or enter a direct image URL.');
      }

      // Read current stored shape (may be the legacy single-logo format).
      const existingSetting = await prisma.siteSetting.findUnique({ where: { key: 'site_logo' } }).catch(() => null);
      let stored: any = {};
      if (existingSetting) {
        try { stored = JSON.parse(existingSetting.value); } catch { stored = {}; }
      }

      // Delete the asset this upload replaces:
      //  - the previous occupant of this slot, and
      //  - the legacy single-logo asset (only referenced by the legacy shape).
      const toDelete = new Set<string>();
      const previousSlotId = stored?.slots?.[slot]?.publicId;
      if (previousSlotId) toDelete.add(previousSlotId);
      if (stored?.publicId && !stored?.slots) toDelete.add(stored.publicId);
      for (const pid of toDelete) {
        if (pid && pid !== publicId) {
          await deleteFromCloudinary(pid).catch(() => { /* best-effort */ });
        }
      }

      // Merge into the slot-based shape and persist.
      const slots = {
        ...(stored?.slots || {}),
        [slot]: { url: imageUrl, publicId },
      };
      const payload = normalizeLogoPayload({ slots });

      await prisma.siteSetting.upsert({
        where: { key: 'site_logo' },
        update: { value: JSON.stringify({ slots }) },
        create: { key: 'site_logo', value: JSON.stringify({ slots }) },
      });

      res.json({ success: true, data: payload });
    } catch (error) { next(error); }
  }

  async deleteSiteLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const slot = req.query.slot ? String(req.query.slot).toLowerCase() : null;
      const existing = await prisma.siteSetting.findUnique({ where: { key: 'site_logo' } });
      if (existing) {
        let stored: any = {};
        try { stored = JSON.parse(existing.value); } catch { /* ignore */ }

        if (slot && LOGO_SLOTS.includes(slot as LogoSlot)) {
          // Remove a single slot; keep the others.
          const slots = { ...(stored?.slots || {}) };
          const removed = slots[slot];
          delete slots[slot];
          if (removed?.publicId) {
            await deleteFromCloudinary(removed.publicId).catch(() => { /* best-effort */ });
          }
          await prisma.siteSetting.update({
            where: { key: 'site_logo' },
            data: { value: JSON.stringify(Object.keys(slots).length > 0 ? { slots } : {}) },
          });
        } else {
          // No slot specified: remove everything.
          const publicIds = new Set<string>();
          if (stored?.publicId) publicIds.add(stored.publicId);
          for (const s of LOGO_SLOTS) {
            const pid = stored?.slots?.[s]?.publicId;
            if (pid) publicIds.add(pid);
          }
          for (const pid of publicIds) {
            await deleteFromCloudinary(pid).catch(() => { /* best-effort */ });
          }
          await prisma.siteSetting.delete({ where: { key: 'site_logo' } });
        }
      }
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

  // ── Homepage Settings ─────────────────────────────────────────────────────
  // Stores all homepage section images in a single JSON blob under the key
  // "homepage_settings" in the SiteSetting table. The frontend reads this
  // on every page load and falls back to built-in Cloudinary URLs.

  static readonly DEFAULT_HOMEPAGE_SETTINGS = {
    heroBanner: {
      desktop: { url: '', publicId: '' },
      mobile: { url: '', publicId: '' },
      heading: 'Shop Our Newest Collection',
      subheading: 'PREMIUM WASH & WEAR • SHOP OUR COLLECTION',
      buttonText: 'Shop Now',
      buttonLink: '/products',
    },
    categoryCards: [
      {
        id: 'two-piece',
        label: 'TWO PIECE',
        subtitle: "Men's",
        href: '/products/category/two-piece',
        imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788630568/ecommerce-products/qddnzjm16r9mljo8gihe.jpg',
      },
      {
        id: 'three-piece',
        label: 'THREE PIECE',
        subtitle: "Men's",
        href: '/products/category/three-piece',
        imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788614812/ecommerce-products/krkdpdqc0a4mf437lzr1.jpg',
      },
      {
        id: 'wash-wear',
        label: 'WASH & WEAR',
        subtitle: "Men's",
        href: '/products/category/unstitched-fabric',
        imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788890028/ecommerce-products/gpj4ravzcy5jdfewlhx9.jpg',
      },
      {
        id: 'stitched',
        label: 'SHALWAR KAMEEZ & KURTA',
        subtitle: "Men's Stitched",
        href: '/products/category/stitched',
        imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788614550/ecommerce-products/miz32cpgjlvw0ejejplp.jpg',
      },
    ],
    collectionSections: [
      {
        id: 'unstitched-collection',
        title: 'UNSTITCHED FABRIC COLLECTION',
        href: '/products/category/unstitched-fabric',
        imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788891170/ecommerce-products/eki2qssmwkiagxn9fx5y.jpg',
      },
      {
        id: 'stitched-collection',
        title: 'STITCHED KURTA COLLECTION',
        href: '/products/category/stitched',
        imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788614550/ecommerce-products/miz32cpgjlvw0ejejplp.jpg',
      },
      {
        id: 'waistcoat-collection',
        title: 'WAISTCOAT & SUITS COLLECTION',
        href: '/products/category/waist-coats',
        imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788614812/ecommerce-products/krkdpdqc0a4mf437lzr1.jpg',
      },
    ],
    showcaseCards: [
      {
        id: 'showcase-left',
        badge: 'ROYAL HERITAGE',
        title: 'Luxury Boski & Formal Fabrics',
        cta: 'DISCOVER COLLECTION',
        href: '/products/category/unstitched-fabric',
        imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788890028/ecommerce-products/gpj4ravzcy5jdfewlhx9.jpg',
      },
      {
        id: 'showcase-right',
        badge: 'SIGNATURE WEAR',
        title: 'Summer Wash & Wear Edit',
        cta: 'EXPLORE STYLES',
        href: '/products/category/unstitched-fabric',
        imageUrl: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788630568/ecommerce-products/qddnzjm16r9mljo8gihe.jpg',
      },
    ],
    productsBanner: {
      desktop: {
        url: 'https://res.cloudinary.com/fmxzphak/image/upload/v1788891170/ecommerce-products/eki2qssmwkiagxn9fx5y.jpg',
        publicId: '',
      },
      mobile: { url: '', publicId: '' },
      title: 'All Products Collection',
      subtitle: "Premium Men's Luxury Fabrics & Stitched Wear",
    },
  };

  async getHomepageSettings(_req: Request, res: Response, next: NextFunction) {
    try {
      const setting = await prisma.siteSetting.findUnique({ where: { key: 'homepage_settings' } });
      const stored = setting ? JSON.parse(setting.value) : {};
      // Deep-merge stored over defaults so missing keys always have a fallback
      const defaults = AdminController.DEFAULT_HOMEPAGE_SETTINGS;
      const data = {
        heroBanner: { ...defaults.heroBanner, ...(stored.heroBanner || {}) },
        productsBanner: { ...defaults.productsBanner, ...(stored.productsBanner || {}) },
        categoryCards: stored.categoryCards?.length ? stored.categoryCards : defaults.categoryCards,
        collectionSections: stored.collectionSections?.length ? stored.collectionSections : defaults.collectionSections,
        showcaseCards: stored.showcaseCards?.length ? stored.showcaseCards : defaults.showcaseCards,
      };
      res.json({ success: true, data });
    } catch (error) {
      // Always return defaults on error so the frontend never breaks
      res.json({ success: true, data: AdminController.DEFAULT_HOMEPAGE_SETTINGS });
    }
  }

  async updateHomepageSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body || {};
      const defaults = AdminController.DEFAULT_HOMEPAGE_SETTINGS;
      const payload = {
        heroBanner: {
          ...defaults.heroBanner,
          ...(body.heroBanner || {}),
        },
        productsBanner: {
          ...defaults.productsBanner,
          ...(body.productsBanner || {}),
        },
        categoryCards: Array.isArray(body.categoryCards) && body.categoryCards.length
          ? body.categoryCards
          : defaults.categoryCards,
        collectionSections: Array.isArray(body.collectionSections) && body.collectionSections.length
          ? body.collectionSections
          : defaults.collectionSections,
        showcaseCards: Array.isArray(body.showcaseCards) && body.showcaseCards.length
          ? body.showcaseCards
          : defaults.showcaseCards,
      };
      await prisma.siteSetting.upsert({
        where: { key: 'homepage_settings' },
        update: { value: JSON.stringify(payload) },
        create: { key: 'homepage_settings', value: JSON.stringify(payload) },
      });

      // Also synchronize hero_banner, hero_banner_mobile, and hero_banner_text
      // so all legacy SSR endpoints and direct siteSetting readers remain 100% in sync
      if (payload.heroBanner?.desktop?.url) {
        await prisma.siteSetting.upsert({
          where: { key: 'hero_banner' },
          update: { value: JSON.stringify({ url: payload.heroBanner.desktop.url, publicId: payload.heroBanner.desktop.publicId || '' }) },
          create: { key: 'hero_banner', value: JSON.stringify({ url: payload.heroBanner.desktop.url, publicId: payload.heroBanner.desktop.publicId || '' }) },
        });
      }
      if (payload.heroBanner?.mobile?.url) {
        await prisma.siteSetting.upsert({
          where: { key: 'hero_banner_mobile' },
          update: { value: JSON.stringify({ url: payload.heroBanner.mobile.url, publicId: payload.heroBanner.mobile.publicId || '' }) },
          create: { key: 'hero_banner_mobile', value: JSON.stringify({ url: payload.heroBanner.mobile.url, publicId: payload.heroBanner.mobile.publicId || '' }) },
        });
      }
      if (payload.heroBanner) {
        await prisma.siteSetting.upsert({
          where: { key: 'hero_banner_text' },
          update: {
            value: JSON.stringify({
              heading: payload.heroBanner.heading,
              subheading: payload.heroBanner.subheading,
              buttonText: payload.heroBanner.buttonText,
              buttonLink: payload.heroBanner.buttonLink,
            }),
          },
          create: {
            key: 'hero_banner_text',
            value: JSON.stringify({
              heading: payload.heroBanner.heading,
              subheading: payload.heroBanner.subheading,
              buttonText: payload.heroBanner.buttonText,
              buttonLink: payload.heroBanner.buttonLink,
            }),
          },
        });
      }

      if (payload.productsBanner?.desktop?.url) {
        await prisma.siteSetting.upsert({
          where: { key: 'products_banner' },
          update: { value: JSON.stringify({ url: payload.productsBanner.desktop.url, publicId: payload.productsBanner.desktop.publicId || '' }) },
          create: { key: 'products_banner', value: JSON.stringify({ url: payload.productsBanner.desktop.url, publicId: payload.productsBanner.desktop.publicId || '' }) },
        });
      }
      if (payload.productsBanner?.mobile?.url) {
        await prisma.siteSetting.upsert({
          where: { key: 'products_banner_mobile' },
          update: { value: JSON.stringify({ url: payload.productsBanner.mobile.url, publicId: payload.productsBanner.mobile.publicId || '' }) },
          create: { key: 'products_banner_mobile', value: JSON.stringify({ url: payload.productsBanner.mobile.url, publicId: payload.productsBanner.mobile.publicId || '' }) },
        });
      }

      res.json({ success: true, data: payload });
    } catch (error) { next(error); }
  }

  async uploadHomepageImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No image file provided.' });
        return;
      }
      if (!isCloudinaryConfigured()) {
        res.status(503).json({ success: false, message: 'Cloudinary is not configured on this server.' });
        return;
      }
      const result = await uploadToCloudinary(req.file.buffer, 'homepage-settings');
      res.json({
        success: true,
        data: {
          url: result.url,
          publicId: result.publicId,
        },
      });
    } catch (error) { next(error); }
  }
}

export const adminController = new AdminController();

