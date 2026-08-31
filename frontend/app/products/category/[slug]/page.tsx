import { Suspense } from 'react';
import type { Metadata } from 'next';
import CategoryPageContent from './CategoryPageContent';
import { fetchServerCategories } from '@/lib/serverData';

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
  const ogImage = matchedCategory?.coverImage || 'https://www.topthreadz.com.pk/images/topthreadz-logo.jpg';

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.topthreadz.com.pk/products/category/${encodeURIComponent(resolvedParams.slug)}`,
    },
    openGraph: {
      type: 'website',
      locale: 'en_PK',
      url: `https://www.topthreadz.com.pk/products/category/${encodeURIComponent(resolvedParams.slug)}`,
      siteName: 'Top Threadz',
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1000,
          height: 1250,
          alt: `${categoryName} Collection - Top Threadz`,
        },
      ],
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

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.topthreadz.com.pk',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Categories',
        item: 'https://www.topthreadz.com.pk/products',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: categoryName,
        item: `https://www.topthreadz.com.pk/products/category/${encodeURIComponent(resolvedParams.slug)}`,
      },
    ],
  };

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoryName} Collection`,
    url: `https://www.topthreadz.com.pk/products/category/${encodeURIComponent(resolvedParams.slug)}`,
    description: `Shop our premium ${categoryName} collection at Top Threadz.`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 text-slate-900 font-bold">Loading collection...</div>}>
        <CategoryPageContent slug={resolvedParams.slug} />
      </Suspense>
    </>
  );
}
