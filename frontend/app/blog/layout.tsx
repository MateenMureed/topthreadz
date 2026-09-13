import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata(
  '/blog',
  "Men's Style Guides & Fabric Insights | Top Threadz",
  'Expert guides on Pakistani menswear: unstitched vs stitched wear, wash & wear fabric selection, wedding dress codes, and tailoring advice.'
);

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
