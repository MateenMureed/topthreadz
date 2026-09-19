import { Request, Response, NextFunction } from 'express';
import { productService } from './product.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import { isCloudinaryConfigured, uploadToCloudinary } from '../../config/cloudinary';
import { applyProductBranding } from '../../utils/brandWatermark';

export class ProductController {
  async uploadImages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const files = (req.files as Express.Multer.File[]) || [];
      if (!files || files.length === 0) {
        return res.json({ success: true, data: { urls: [], images: [] } });
      }

      const skipBranding = req.query.type === 'category' || req.body?.type === 'category';

      // Apply the Top Threadz logo watermark to every product image before upload.
      // Branding runs on the raw buffer so Cloudinary always receives the final image.
      const brandedBuffers = await Promise.all(
        files.map(async (file) => {
          if (skipBranding) return file.buffer;
          try {
            return await applyProductBranding(file.buffer);
          } catch (brandErr) {
            // If branding fails for any reason, fall back to the original buffer
            // so the upload still succeeds and we don't block the admin.
            console.error('[brandWatermark] Branding failed, using original buffer:', brandErr);
            return file.buffer;
          }
        })
      );

      let images: Array<{ url: string; publicId: string }> = [];

      if (isCloudinaryConfigured()) {
        try {
          images = await Promise.all(brandedBuffers.map((buf) => uploadToCloudinary(buf)));
        } catch {
          images = brandedBuffers.map((buf, idx) => ({
            url: `data:image/jpeg;base64,${buf.toString('base64')}`,
            publicId: `img-${Date.now()}-${idx}`,
          }));
        }
      } else {
        images = brandedBuffers.map((buf, idx) => ({
          url: `data:image/jpeg;base64,${buf.toString('base64')}`,
          publicId: `img-${Date.now()}-${idx}`,
        }));
      }

      res.json({ success: true, data: { urls: images.map((image) => image.url), images } });
    } catch (error) { next(error); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await productService.create(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error) { next(error); }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const maybeUserId = (req as AuthRequest).user?.userId;
      const query = { ...req.query, userId: maybeUserId };
      const result = await productService.findAll(query);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.findById(req.params.id as string);
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  }

  async findBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.findBySlug(req.params.slug as string);
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const product = await productService.update(req.params.id as string, req.body);
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await productService.delete(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async recordView(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await productService.recordView(req.user.userId, req.params.id as string);
      }
      res.json({ success: true });
    } catch (error) { next(error); }
  }

  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await productService.getCategories();
      res.json({ success: true, data: categories });
    } catch (error) { next(error); }
  }

  async searchSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const suggestions = await productService.searchSuggestions(req.query.q as string);
      res.json({ success: true, data: suggestions });
    } catch (error) { next(error); }
  }

  async getPopularSearches(_req: Request, res: Response, next: NextFunction) {
    try {
      const searches = await productService.getPopularSearches();
      res.json({ success: true, data: searches });
    } catch (error) { next(error); }
  }

  async aiSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const q = String(req.query.q || '');
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 12);
      const result = await productService.aiSearch(q, page, limit);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getUpsellSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const products = await productService.getUpsellSuggestions(req.params.id as string);
      res.json({ success: true, data: products });
    } catch (error) { next(error); }
  }
}

export const productController = new ProductController();
