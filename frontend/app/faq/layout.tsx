import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata(
  '/faq',
  'Frequently Asked Questions',
  'Answers about Top Threadz collections, nationwide delivery across Pakistan, Cash on Delivery payments, returns, exchanges and product care.'
);

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
