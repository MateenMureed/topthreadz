import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(240).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(10),
  price: z.number().positive(),
  discount: z.number().min(0).max(100).default(0),
  category: z.string().min(1),
  subcategory: z.string().min(1).optional(),
  brand: z.string().min(1).max(120).optional(),
  collection: z.string().min(1).max(120).optional(),
  gender: z.enum(['MALE']).optional(),
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  imageMeta: z.array(z.object({
    url: z.string(),
    publicId: z.string().optional(),
    alt: z.string().optional(),
    isPrimary: z.boolean().optional(),
  })).optional(),
  stock: z.number().int().min(0).default(0),
  stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'PREORDER']).optional(),
  lowStockThreshold: z.number().int().min(0).default(5),
  sku: z.string().min(1).max(120).optional(),
  careInstructions: z.string().max(2000).optional(),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
  productStatus: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional(),
  visibility: z.enum(['PUBLIC']).optional(),
  tags: z.array(z.string()).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('12'),
  category: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  collection: z.string().optional(),
  gender: z.enum(['MALE']).optional(),
  productStatus: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional(),
  visibility: z.enum(['PUBLIC']).optional(),
  stockStatus: z.enum(['IN_STOCK', 'OUT_OF_STOCK', 'PREORDER']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'popular', 'recommended']).optional().default('newest'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
