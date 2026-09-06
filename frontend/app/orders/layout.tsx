import type { Metadata } from 'next';
import { noindexMetadata } from '@/lib/seo';

export const metadata: Metadata = noindexMetadata('Track Orders');

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
