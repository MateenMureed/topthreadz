import { Suspense } from 'react';
import type { Metadata } from 'next';
import CategoryPageContent from './CategoryPageContent';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const categoryName = decodeURIComponent(params.slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${categoryName} | Top Threadz`,
    description: `Shop our exclusive ${categoryName} collection. Premium quality wash & wear, unstitched & stitched suits at Top Threadz.`,
    openGraph: {
      title: `${categoryName} | Top Threadz`,
      description: `Shop our exclusive ${categoryName} collection at Top Threadz.`,
      type: 'website',
    },
  };
}

export default function CategoryPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-slate-900 font-bold">Loading collection...</div>}>
      <CategoryPageContent slug={params.slug} />
    </Suspense>
  );
}
