import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata(
  '/about',
  "About Top Threadz | Men's Fashion Pakistan",
  'Discover Top Threadz — Pakistan’s premier destination for men’s unstitched wash & wear fabrics, stitched kurtas, and luxury menswear. Visit our Karachi flagship store.'
);

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
