import { AlertType, AnalyticsEventType, Prisma } from '@prisma/client';
import prisma from '../../utils/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';

interface SaveForLaterInput {
  productId: string;
  quantity?: number;
  size?: string;
  color?: string;
}

interface AnalyticsInput {
  type: AnalyticsEventType;
  sessionId?: string;
  page?: string;
  metadata?: Record<string, unknown>;
}

export class ExperienceService {
  async getWishlist(userId: string) {
    return prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discount: true,
            images: true,
            stock: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleWishlist(userId: string, productId: string) {
    const existing = await prisma.wishlistItem.findFirst({ where: { userId, productId } });
    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return { wishlisted: false };
    }

    await prisma.wishlistItem.create({ data: { userId, productId } });
    return { wishlisted: true };
  }

  async getCompare(userId: string) {
    return prisma.compareItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discount: true,
            images: true,
            category: true,
            sizes: true,
            colors: true,
            stock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToCompare(userId: string, productId: string) {
    const currentCount = await prisma.compareItem.count({ where: { userId } });
    if (currentCount >= 4) {
      throw new BadRequestError('You can compare up to 4 products at a time');
    }

    await prisma.compareItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });

    return this.getCompare(userId);
  }

  async removeFromCompare(userId: string, productId: string) {
    const existing = await prisma.compareItem.findFirst({ where: { userId, productId } });
    if (!existing) {
      throw new NotFoundError('Compared product not found');
    }

    await prisma.compareItem.delete({ where: { id: existing.id } });
    return this.getCompare(userId);
  }

  async getSavedForLater(userId: string) {
    return prisma.savedForLaterItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discount: true,
            images: true,
            stock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveForLater(userId: string, data: SaveForLaterInput) {
    await prisma.savedForLaterItem.create({
      data: {
        userId,
        productId: data.productId,
        quantity: data.quantity || 1,
        size: data.size,
        color: data.color,
      },
    });

    return this.getSavedForLater(userId);
  }

  async removeSavedForLater(userId: string, itemId: string) {
    const existing = await prisma.savedForLaterItem.findFirst({ where: { id: itemId, userId } });
    if (!existing) throw new NotFoundError('Saved item not found');

    await prisma.savedForLaterItem.delete({ where: { id: itemId } });
    return this.getSavedForLater(userId);
  }

  async getRecentlyViewed(userId: string) {
    const views = await prisma.productView.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discount: true,
            images: true,
            category: true,
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
      take: 12,
    });

    return views.map((item) => item.product);
  }

  async createProductAlert(userId: string, productId: string, type: AlertType, targetPrice?: number) {
    return prisma.productAlert.create({
      data: {
        userId,
        productId,
        type,
        targetPrice,
      },
    });
  }

  async getAlerts(userId: string) {
    return prisma.productAlert.findMany({
      where: { userId, isActive: true },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            discount: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeAlert(userId: string, alertId: string) {
    const alert = await prisma.productAlert.findFirst({ where: { id: alertId, userId } });
    if (!alert) throw new NotFoundError('Alert not found');

    await prisma.productAlert.delete({ where: { id: alertId } });
    return { message: 'Alert removed' };
  }

  async trackAnalyticsEvent(userId: string | null, input: AnalyticsInput) {
    const metadata = input.metadata as Prisma.InputJsonValue | undefined;
    return prisma.analyticsEvent.create({
      data: {
        userId,
        type: input.type,
        sessionId: input.sessionId,
        page: input.page,
        metadata,
      },
    });
  }

  async getSearchInsights() {
    const topQueries = await prisma.searchQuery.groupBy({
      by: ['query'],
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 15,
    });

    return topQueries.map((item) => ({
      query: item.query,
      total: item._count.query,
    }));
  }

  async getBusinessAnalytics() {
    const [topProducts, cartAbandonment, conversionFunnel, clv] = await Promise.all([
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      prisma.analyticsEvent.count({ where: { type: 'CART_ABANDON' } }),
      prisma.analyticsEvent.groupBy({ by: ['type'], _count: { type: true } }),
      prisma.order.groupBy({ by: ['userId'], _sum: { total: true } }),
    ]);

    const avgClv = clv.length > 0
      ? clv.reduce((sum, item) => sum + (item._sum.total || 0), 0) / clv.length
      : 0;

    return {
      topProducts,
      cartAbandonment,
      conversionFunnel,
      customerLifetimeValueAverage: Math.round(avgClv),
    };
  }
}

export const experienceService = new ExperienceService();
