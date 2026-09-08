import { Router } from 'express';
import prisma from '../../utils/prisma';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

function parseCategoryImages(rawCover: string | null | undefined) {
  if (!rawCover) return { cardImage: null, bannerImage: null };
  const trimmed = rawCover.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        cardImage: parsed.card || parsed.coverImage || null,
        bannerImage: parsed.banner || parsed.bannerImage || null,
      };
    } catch {
      return { cardImage: trimmed, bannerImage: trimmed };
    }
  }
  return { cardImage: trimmed, bannerImage: trimmed };
}

function serializeCategoryImages(cardImage?: string | null, bannerImage?: string | null, existingRaw?: string | null) {
  const existing = parseCategoryImages(existingRaw);
  const finalCard = cardImage !== undefined ? (cardImage ? cardImage.trim() : null) : existing.cardImage;
  const finalBanner = bannerImage !== undefined ? (bannerImage ? bannerImage.trim() : null) : existing.bannerImage;

  if (finalCard && finalBanner && finalCard !== finalBanner) {
    return JSON.stringify({ card: finalCard, banner: finalBanner });
  }
  return finalBanner || finalCard || null;
}

router.get('/', async (req, res, next) => {
  try {
    const includeAll = req.query.all === 'true';
    const whereCondition = includeAll ? {} : { isActive: true };

    const rows = await prisma.category.findMany({
      where: whereCondition,
      orderBy: { sortOrder: 'asc' }
    });

    const categoriesWithFallback = await Promise.all(
      rows.map(async (cat) => {
        const { cardImage: parsedCard, bannerImage: parsedBanner } = parseCategoryImages(cat.coverImage);
        const hasCustomImage = Boolean(parsedCard || parsedBanner);
        let displayImage = parsedCard || parsedBanner || null;

        if (!displayImage) {
          const latestProduct = await prisma.product.findFirst({
            where: {
              category: { equals: cat.name, mode: 'insensitive' },
              isActive: true
            },
            orderBy: { createdAt: 'desc' },
            select: { images: true }
          });
          if (latestProduct?.images && latestProduct.images.length > 0) {
            displayImage = latestProduct.images[0];
          }
        }

        return {
          ...cat,
          rawCoverImage: cat.coverImage,
          coverImage: displayImage || null,
          cardImage: parsedCard || displayImage || null,
          bannerImage: parsedBanner || displayImage || null,
          hasCustomImage,
          isFallbackImage: !hasCustomImage && Boolean(displayImage)
        };
      })
    );

    res.json({ success: true, data: categoriesWithFallback });
  } catch (e) {
    next(e);
  }
});

router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, slug, coverImage, bannerImage, description, isActive = true, sortOrder = 0 } = req.body;
    const serialized = serializeCategoryImages(coverImage, bannerImage);
    const row = await prisma.category.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        coverImage: serialized,
        description: description && typeof description === 'string' && description.trim() !== '' ? description.trim() : null,
        isActive,
        sortOrder
      }
    });
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    const { coverImage, bannerImage, description, ...rest } = req.body;
    const existing = await prisma.category.findUnique({ where: { id: String(req.params.id) } });
    const updateData: any = { ...rest };
    if (coverImage !== undefined || bannerImage !== undefined) {
      updateData.coverImage = serializeCategoryImages(coverImage, bannerImage, existing?.coverImage);
    }
    if (description !== undefined) {
      updateData.description = description && typeof description === 'string' && description.trim() !== '' ? description.trim() : null;
    }
    const row = await prisma.category.update({
      where: { id: String(req.params.id) },
      data: updateData
    });
    res.json({ success: true, data: row });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.category.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
