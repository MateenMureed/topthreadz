import { z } from 'zod';

// Request body for POST /api/products/generate-seo.
// Keep the accepted surface tight: only fields the prompt builder consumes,
// bounded sizes to prevent excessively large requests.
export const generateSeoSchema = z.object({
  id: z.string().uuid().optional(), // present when editing an existing product
  name: z.string().min(2).max(200),
  category: z.string().max(120).optional(),
  subcategory: z.string().max(120).optional(),
  collection: z.string().max(120).optional(),
  productType: z.string().max(120).optional(),
  fabric: z.string().max(160).optional(),
  material: z.string().max(160).optional(),
  color: z.string().max(80).optional(),
  colors: z.array(z.string().max(80)).max(20).optional(),
  price: z.number().positive().max(10_000_000).optional(),
  salePrice: z.number().positive().max(10_000_000).optional(),
  discount: z.number().min(0).max(100).optional(),
  description: z.string().max(6000).optional(),
  shortDescription: z.string().max(500).optional(),
  attributes: z.record(z.string().max(60), z.string().max(200)).optional(),
  brand: z.string().max(120).optional(),
  tags: z.array(z.string().max(60)).max(30).optional(),
  sizes: z.array(z.string().max(40)).max(30).optional(),
  careInstructions: z.string().max(2000).optional(),
  slug: z.string().max(240).optional(),
  sections: z.array(z.enum(['description', 'seo', 'keywords', 'meta', 'faqs'])).max(5).optional(),
}).strict();

export type GenerateSeoInput = z.infer<typeof generateSeoSchema>;
