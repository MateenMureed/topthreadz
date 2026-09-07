import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata(
  '/products',
  'Shop All Products — Unstitched, Stitched & Suits',
  'Browse the full Top Threadz collection: premium unstitched fabric, stitched wear and suits with nationwide delivery in Pakistan.'
);

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
