import { Suspense } from 'react';
import type { Metadata } from 'next';
import CategoryPageContent from './CategoryPageContent';
import { fetchServerCategories } from '@/lib/serverData';
import { SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }> | { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSlug = decodeURIComponent(resolvedParams.slug || '');
  const categoryName = rawSlug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const categories = await fetchServerCategories();
  const matchedCategory = categories.find(
    (c: any) =>
      c.slug?.toLowerCase() === rawSlug.toLowerCase() ||
      c.name?.toLowerCase() === categoryName.toLowerCase()
  );

  const title = `${categoryName} Men's Collection | Top Threadz`;
  const description = `Shop exclusive ${categoryName} at Top Threadz. Premium Pakistani men's unstitched wash & wear fabrics, Boski, and tailored stitched suits with fast nationwide delivery.`;
  const ogImage = matchedCategory?.coverImage || DEFAULT_OG_IMAGE;

  // Category-level keywords: admin "keywords" on the category record (if you
  // add one — see suggestions), falling back to the category name itself.
  const keywords = [
    matchedCategory?.keywords,
    categoryName,
    `${categoryName} Pakistan`,
    'Top Threadz',
    'men\'s fabric',
  ]
    .flatMap((k: any) => (Array.isArray(k) ? k : typeof k === 'string' ? k.split(',') : []))
    .map((k: string) => k.trim())
    .filter(Boolean);

  const canonicalUrl = `${SITE_URL}/products/category/${encodeURIComponent(resolvedParams.slug)}`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: canonicalUrl },
    // Don't index a category slug that doesn't map to anything real.
    robots: { index: !!matchedCategory, follow: true },
    openGraph: {
      type: 'website',
      locale: 'en_PK',
      url: canonicalUrl,
      siteName: 'Top Threadz',
      title,
      description,
      images: [{ url: ogImage, width: 1000, height: 1250, alt: `${categoryName} Collection - Top Threadz` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const resolvedParams = await params;
  const rawSlug = decodeURIComponent(resolvedParams.slug || '');
  const categoryName = rawSlug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const canonicalUrl = `${SITE_URL}/products/category/${encodeURIComponent(resolvedParams.slug)}`;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Categories', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: categoryName, item: canonicalUrl },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoryName} Collection`,
    url: canonicalUrl,
    description: `Shop our premium ${categoryName} collection at Top Threadz.`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-slate-900 font-bold">Loading collection...</div>}>
        <CategoryPageContent slug={resolvedParams.slug} />
      </Suspense>
    </>
  );
}