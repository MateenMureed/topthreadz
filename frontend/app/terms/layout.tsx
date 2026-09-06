import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata(
  '/terms',
  'Terms of Service',
  'Terms of service for shopping with Top Threadz: orders and payments, product and sizing guidance, returns, liability and contact information.'
);

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
