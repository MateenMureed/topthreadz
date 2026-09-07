import { Request, Response, NextFunction } from 'express';
import prisma from '../../utils/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { AuthRequest } from '../../middleware/auth.middleware';

export class ReviewController {
  /**
   * Create a review for a product (public or authenticated)
   */
  async createReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rawId = req.params.id;
      const productId = Array.isArray(rawId) ? rawId[0] : String(rawId || '');
      const { rating, title, comment, userName, userEmail } = req.body;

      if (!productId) {
        throw new BadRequestError('Product ID is required');
      }

      const parsedRating = Number(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        throw new BadRequestError('Rating must be an integer between 1 and 5');
      }

      // Check product exists (by id or slug)
      const product = await prisma.product.findFirst({
        where: {
          OR: [{ id: productId }, { slug: productId }],
        },
        select: { id: true, name: true },
      });

      if (!product) {
        throw new NotFoundError('Product not found');
      }

      const userId = req.user?.userId || null;
      let finalName = (userName || '').trim();
      let finalEmail = (userEmail || '').trim();

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        });
        if (user) {
          if (!finalName) finalName = user.name;
          if (!finalEmail) finalEmail = user.email;
        }
      }

      if (!finalName) {
        finalName = 'Customer';
      }

      // Check if buyer has verified order for this product
      let isVerifiedBuyer = false;
      if (userId || finalEmail) {
        const purchased = await prisma.orderItem.findFirst({
          where: {
            productId: product.id,
            order: {
              OR: [
                ...(userId ? [{ userId }] : []),
                ...(finalEmail ? [{ user: { email: finalEmail } }] : []),
              ],
            },
          },
        });
        if (purchased) {
          isVerifiedBuyer = true;
        }
      }

      const review = await prisma.review.create({
        data: {
          productId: product.id,
          userId,
          userName: finalName,
          userEmail: finalEmail || null,
          rating: parsedRating,
          title: title ? String(title).trim().slice(0, 150) : null,
          comment: comment ? String(comment).trim().slice(0, 2000) : null,
          isVerifiedBuyer,
          isApproved: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Thank you! Your review has been submitted successfully.',
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get approved reviews & aggregate summary for a product
   */
  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const rawId = req.params.id;
      const productId = Array.isArray(rawId) ? rawId[0] : String(rawId || '');
      const page = Math.max(1, parseInt(req.query.page as string || '1'));
      const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string || '10')));
      const skip = (page - 1) * limit;

      // Match either ID or Slug
      const product = await prisma.product.findFirst({
        where: {
          OR: [{ id: productId }, { slug: productId }],
        },
        select: { id: true },
      });

      if (!product) {
        return res.json({
          success: true,
          data: {
            reviews: [],
            stats: {
              averageRating: 0,
              totalReviews: 0,
              breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            },
            pagination: { page, limit, totalPages: 0, totalReviews: 0 },
          },
        });
      }

      const [reviews, totalReviews, allRatings] = await Promise.all([
        prisma.review.findMany({
          where: { productId: product.id, isApproved: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: {
            id: true,
            userName: true,
            rating: true,
            title: true,
            comment: true,
            isVerifiedBuyer: true,
            createdAt: true,
          },
        }),
        prisma.review.count({
          where: { productId: product.id, isApproved: true },
        }),
        prisma.review.findMany({
          where: { productId: product.id, isApproved: true },
          select: { rating: true },
        }),
      ]);

      const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let sumRating = 0;

      for (const r of allRatings) {
        sumRating += r.rating;
        const star = Math.max(1, Math.min(5, Math.round(r.rating)));
        breakdown[star] = (breakdown[star] || 0) + 1;
      }

      const averageRating = totalReviews > 0 ? Number((sumRating / totalReviews).toFixed(1)) : 0;
      const totalPages = Math.ceil(totalReviews / limit);

      res.json({
        success: true,
        data: {
          reviews,
          stats: {
            averageRating,
            totalReviews,
            breakdown,
          },
          pagination: {
            page,
            limit,
            totalPages,
            totalReviews,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer reviews for homepage testimonial section ("WHAT CUSTOMER SPEAK FOR US")
   * Only returns real customer reviews submitted to the database.
   */
  async getFeaturedReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const dbReviews = await prisma.review.findMany({
        where: {
          isApproved: true,
          rating: { gte: 4 },
          comment: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          userName: true,
          rating: true,
          title: true,
          comment: true,
          isVerifiedBuyer: true,
          createdAt: true,
          product: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      });

      const withComments = dbReviews.filter((r) => r.comment && r.comment.trim().length > 0);

      res.json({
        success: true,
        data: withComments,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();
