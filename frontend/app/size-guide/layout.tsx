import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata(
  '/size-guide',
  "Men's Size Guide & Fabric Chart | Top Threadz",
  'Complete size guide for Pakistani men\'s kurta, stitched suits, waistcoats, and unstitched fabric cutting specs at Top Threadz.'
);

export default function SizeGuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
