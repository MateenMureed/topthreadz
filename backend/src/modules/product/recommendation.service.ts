import prisma from '../../utils/prisma';

export class RecommendationService {
  async getRecommendations(userId: string, limit = 8) {
    const viewedProducts = await prisma.productView.findMany({
      where: { userId },
      include: { product: { select: { id: true, category: true } } },
      orderBy: { viewedAt: 'desc' },
      take: 20,
    });

    if (viewedProducts.length === 0) {
      return this.getPopularProducts(limit);
    }

    const viewedIds = viewedProducts.map((v: (typeof viewedProducts)[number]) => v.productId);
    const categories = [...new Set(viewedProducts.map((v: (typeof viewedProducts)[number]) => v.product.category))];

    const recommendations = await prisma.product.findMany({
      where: {
        isActive: true,
        category: { in: categories },
        id: { notIn: viewedIds },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    if (recommendations.length < limit) {
      const popular = await this.getPopularProducts(
        limit - recommendations.length,
        [...viewedIds, ...recommendations.map((r: (typeof recommendations)[number]) => r.id)]
      );
      recommendations.push(...popular);
    }

    return recommendations;
  }

  async getPopularProducts(limit = 8, excludeIds: string[] = []) {
    const popular = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      },
      orderBy: { views: { _count: 'desc' } },
      take: limit,
    });

    return popular;
  }

  async getSimilarProducts(productIdentifier: string, limit = 4) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productIdentifier);
    const product = isUuid
      ? await prisma.product.findFirst({ where: { OR: [{ id: productIdentifier }, { slug: productIdentifier }] } })
      : await prisma.product.findUnique({ where: { slug: productIdentifier } });
    if (!product) return [];

    const productId = product.id;

    return prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        OR: [
          { category: product.category },
          { tags: { hasSome: product.tags } },
        ],
      },
      take: limit,
    });
  }
}

export const recommendationService = new RecommendationService();
