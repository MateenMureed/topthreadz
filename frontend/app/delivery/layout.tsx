import type { Metadata } from 'next';
import { publicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = publicPageMetadata(
  '/delivery',
  'Delivery & Shipping Policy',
  'Top Threadz delivery information: nationwide shipping across Pakistan, Cash on Delivery availability, order tracking and delivery timelines.'
);

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
