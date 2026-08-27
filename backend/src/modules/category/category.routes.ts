import { Router } from 'express';
import prisma from '../../utils/prisma';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();
router.get('/', async (_req, res, next) => { try { const rows = await prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }); res.json({ success: true, data: rows }); } catch (e) { next(e); } });
router.post('/', authenticate, authorize('ADMIN'), async (req, res, next) => { try { const { name, slug, coverImage, description, isActive = true, sortOrder = 0 } = req.body; const row = await prisma.category.create({ data: { name, slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), coverImage, description, isActive, sortOrder } }); res.status(201).json({ success: true, data: row }); } catch (e) { next(e); } });
router.patch('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => { try { const row = await prisma.category.update({ where: { id: String(req.params.id) }, data: req.body }); res.json({ success: true, data: row }); } catch (e) { next(e); } });
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res, next) => { try { await prisma.category.delete({ where: { id: String(req.params.id) } }); res.json({ success: true }); } catch (e) { next(e); } });
export default router;
