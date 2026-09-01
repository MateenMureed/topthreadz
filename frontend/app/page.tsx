import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';
import {
  fetchServerCategories,
  fetchServerProducts,
  fetchServerHeroBanner, fetchServerHeroBanners,
  fetchServerStoreSettings,
} from '@/lib/serverData';

export const revalidate = 60; // ISR revalidate every 60 seconds

export async function generateMetadata(): Promise<Metadata> {
  const [categories, settings, heroBanner] = await Promise.all([
    fetchServerCategories(),
    fetchServerStoreSettings(),
    fetchServerHeroBanner(),
  ]);

  const categoryNames = categories.map((c: any) => c.name).filter(Boolean);
  const categoryHighlights = categoryNames.length > 0
    ? categoryNames.slice(0, 4).join(', ')
    : 'Unstitched Wash & Wear, Boski, Stitched Kurtas';

  const title = 'Top Threadz | Men\'s Wash & Wear, Boski & Stitched Fabric Store Pakistan';
  const description = `Discover premium men's clothing at Top Threadz. Shop ${categoryHighlights} — luxury unstitched fabrics, Boski, and tailored stitched suits. Flagship store at Zamzama DHA Phase 5 Karachi with nationwide delivery over PKR 10,000.`;

  const ogImage = heroBanner || categories[0]?.coverImage || '/images/topthreadz-logo.jpg';

  return {
    title,
    description,
    alternates: {
      canonical: 'https://www.topthreadz.com.pk',
    },
    openGraph: {
      type: 'website',
      locale: 'en_PK',
      url: 'https://www.topthreadz.com.pk/',
      siteName: 'Top Threadz',
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: 'Top Threadz Men\'s Luxury Fabrics Collection',
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

export default async function HomePage() {
  const [categories, products, heroBanner, settings, heroBanners] = await Promise.all([
    fetchServerCategories(),
    fetchServerProducts({ limit: 50, sortBy: 'newest' }),
    fetchServerHeroBanner(),
    fetchServerStoreSettings(),
    fetchServerHeroBanners(),
  ]);

  // JSON-LD Structured Data (LocalBusiness + WebSite + ItemList)
  const homeStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.topthreadz.com.pk/#website',
        url: 'https://www.topthreadz.com.pk',
        name: 'Top Threadz',
        description: 'Official Online Store for Premium Men\'s Unstitched & Stitched Fabrics in Pakistan',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://www.topthreadz.com.pk/products?search={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'ClothingStore',
        '@id': 'https://www.topthreadz.com.pk/#zamzama-store',
        name: 'Top Threadz Flagship Store',
        image: heroBanner || 'https://www.topthreadz.com.pk/images/topthreadz-logo.jpg',
        url: 'https://www.topthreadz.com.pk',
        telephone: '+92 300 0000000',
        priceRange: 'PKR 2500 - PKR 25000',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Zamzama Commercial Area, DHA Phase 5',
          addressLocality: 'Karachi',
          addressRegion: 'Sindh',
          postalCode: '75500',
          addressCountry: 'PK',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 24.8197,
          longitude: 67.0163,
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            opens: '11:00',
            closes: '23:00',
          },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': 'https://www.topthreadz.com.pk/#categories-list',
        name: 'Top Threadz Collections',
        itemListElement: categories.map((cat: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: cat.name,
          url: `https://www.topthreadz.com.pk/products/category/${encodeURIComponent(cat.slug || cat.name)}`,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
      <HomePageClient
        initialCategories={categories}
        initialProducts={products}
        initialHeroBanner={heroBanner}
        initialHeroBanners={heroBanners}
        initialSettings={settings}
      />
    </>
  );
}
