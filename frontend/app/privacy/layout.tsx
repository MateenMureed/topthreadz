import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata(
  '/privacy',
  'Privacy Policy',
  'How Top Threadz collects, uses and protects your personal information when you shop, order or contact us online in Pakistan.'
);

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
