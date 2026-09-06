import type { Metadata } from 'next';
import { noindexMetadata } from '@/lib/seo';

export const metadata: Metadata = noindexMetadata('Cart');

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
