import { Router } from 'express';
import prisma from '../../utils/prisma';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

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
        const hasCustomImage = Boolean(cat.coverImage && cat.coverImage.trim() !== '');
        let displayImage = hasCustomImage ? cat.coverImage : null;

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
    const { name, slug, coverImage, description, isActive = true, sortOrder = 0 } = req.body;
    const cleanCover = coverImage && typeof coverImage === 'string' && coverImage.trim() !== '' ? coverImage.trim() : null;
    const row = await prisma.category.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        coverImage: cleanCover,
        description,
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
    const { coverImage, ...rest } = req.body;
    const updateData: any = { ...rest };
    if (coverImage !== undefined) {
      updateData.coverImage = coverImage && typeof coverImage === 'string' && coverImage.trim() !== '' ? coverImage.trim() : null;
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
