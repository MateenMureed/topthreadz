import { NextFunction, Response } from 'express';
import { AlertType, AnalyticsEventType } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth.middleware';
import { BadRequestError } from '../../utils/errors';
import { experienceService } from './experience.service';

export class ExperienceController {
  async getWishlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.getWishlist(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async toggleWishlist(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.toggleWishlist(req.user!.userId, req.params.productId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getCompare(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.getCompare(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async addToCompare(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.addToCompare(req.user!.userId, req.params.productId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async removeFromCompare(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.removeFromCompare(req.user!.userId, req.params.productId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getSavedForLater(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.getSavedForLater(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async saveForLater(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.saveForLater(req.user!.userId, req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async removeSavedForLater(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.removeSavedForLater(req.user!.userId, req.params.itemId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getRecentlyViewed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.getRecentlyViewed(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async createAlert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const type = String(req.body.type || '').toUpperCase() as AlertType;
      if (!Object.values(AlertType).includes(type)) {
        throw new BadRequestError('Invalid alert type');
      }

      const data = await experienceService.createProductAlert(
        req.user!.userId,
        req.body.productId,
        type,
        req.body.targetPrice,
      );
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getAlerts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.getAlerts(req.user!.userId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async removeAlert(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.removeAlert(req.user!.userId, req.params.alertId as string);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async trackAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const type = String(req.body.type || '').toUpperCase() as AnalyticsEventType;
      if (!Object.values(AnalyticsEventType).includes(type)) {
        throw new BadRequestError('Invalid analytics event type');
      }

      const data = await experienceService.trackAnalyticsEvent(req.user?.userId || null, {
        type,
        sessionId: req.body.sessionId,
        page: req.body.page,
        metadata: req.body.metadata,
      });
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getSearchInsights(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.getSearchInsights();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getBusinessAnalytics(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await experienceService.getBusinessAnalytics();
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }
}

export const experienceController = new ExperienceController();
