import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata(
  '/returns',
  'Exchange & Return Policy',
  'Top Threadz exchange and return policy: eligibility, timeframes, condition requirements and how to request a return or exchange in Pakistan.'
);

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
