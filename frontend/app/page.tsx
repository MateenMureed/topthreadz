import type { Metadata } from 'next';
import HomePageClient from '@/components/HomePageClient';
import {
  fetchServerCategories,
  fetchServerProducts,
  fetchServerHeroBanner,
  fetchServerStoreSettings,
} from '@/lib/serverData';

export const revalidate = 60; // ISR revalidate every 60 seconds

const SITE_URL = 'https://www.topthreadz.com.pk';
const BRAND_NAME = 'Top Threadz';
const SITE_DESCRIPTION = 'Discover premium men\'s fashion at Top Threadz, featuring luxury fabrics, unstitched and stitched wear, elegant waistcoats and sophisticated suits, crafted for timeless Pakistani style.';

export async function generateMetadata(): Promise<Metadata> {
  const [categories, settings, heroBanner] = await Promise.all([
    fetchServerCategories(),
    fetchServerStoreSettings(),
    fetchServerHeroBanner(),
  ]);

  // Get primary categories for dynamic title enhancement
  const primaryCategories = categories.slice(0, 3).map((c: any) => c.name).filter(Boolean);
  const categoryString = primaryCategories.length > 0 ? ` | ${primaryCategories.join(', ')}` : '';

  const title = `Top Threadz - Premium Men\'s Clothing & Fashion in Pakistan${categoryString}`;
  const description = SITE_DESCRIPTION;

  // Determine best OG image with fallbacks
  const ogImage = heroBanner || 
                  categories[0]?.coverImage || 
                  settings?.logo || 
                  '/images/topthreadz-og-image.jpg';

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: 'Top Threadz - Premium Men\'s Clothing & Fashion in Pakistan',
      template: `%s | ${BRAND_NAME}`,
    },
    description,
    applicationName: BRAND_NAME,
    authors: [{ name: BRAND_NAME }],
    generator: 'Next.js',
    referrer: 'origin-when-cross-origin',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: SITE_URL,
      languages: {
        'en-US': SITE_URL,
        'en-PK': SITE_URL,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_PK',
      alternateLocale: 'en_US',
      url: SITE_URL,
      siteName: BRAND_NAME,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${BRAND_NAME} - Premium Men's Luxury Fashion Collection in Pakistan`,
          type: 'image/jpeg',
        },
        {
          url: '/images/topthreadz-square-logo.jpg',
          width: 600,
          height: 600,
          alt: `${BRAND_NAME} Logo`,
          type: 'image/jpeg',
        },
      ],
      emails: ['support@topthreadz.pk'],
      phoneNumbers: ['+92-300-9070520'],
      countryName: 'Pakistan',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@topthreadz',
      creator: '@topthreadz',
      title,
      description,
      images: [ogImage],
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        {
          rel: 'mask-icon',
          url: '/safari-pinned-tab.svg',
          color: '#000000',
        },
      ],
    },
    manifest: '/site.webmanifest',
    verification: {
      google: 'h2s93E-7aU8K0vVK_RxrpR-ps_P7ylL0oop_o3qCSJw',
    },
    category: 'fashion',
    other: {
      'format-detection': 'telephone=no',
    },
  };
}

export default async function HomePage() {
  const [categories, products, heroBanner, settings] = await Promise.all([
    fetchServerCategories(),
    fetchServerProducts({ limit: 50, sortBy: 'newest' }),
    fetchServerHeroBanner(),
    fetchServerStoreSettings(),
  ]);

  // Helper functions for URL generation
  const getCategoryUrl = (cat: any) => {
    const slug = cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-');
    return `${SITE_URL}/products/category/${encodeURIComponent(slug)}`;
  };

  const getProductUrl = (product: any) => {
    const slug = product.slug || product.id || product.name?.toLowerCase().replace(/\s+/g, '-');
    return `${SITE_URL}/products/${encodeURIComponent(slug)}`;
  };

  const getProductImage = (product: any) => {
    return product.images?.[0] || product.image || `${SITE_URL}/images/product-placeholder.jpg`;
  };

  const getCategoryCount = (cat: any) => {
    return cat.productCount || cat.products?.length || 0;
  };

  // Generate rich JSON-LD Structured Data
  const homeStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      // Organization
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}#organization`,
        name: BRAND_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/images/topthreadz-logo.jpg`,
          width: 600,
          height: 600,
        },
        image: `${SITE_URL}/images/topthreadz-og-image.jpg`,
        description: SITE_DESCRIPTION,
        foundingDate: '2020',
        foundingLocation: 'Karachi, Pakistan',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'topthreadz, R28V+R3W, Street 2, DHA Phase 5 Zamzama Commercial Area Defence V',
          addressLocality: 'Karachi',
          addressRegion: 'Sindh',
          postalCode: '75600',
          addressCountry: 'PK',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+92-300-9070520',
          contactType: 'customer service',
          availableLanguage: ['English', 'Urdu'],
        },
        sameAs: [
          'https://www.facebook.com/topthreadz',
          'https://www.instagram.com/topthreadz',
          'https://www.youtube.com/topthreadz',
          'https://www.pinterest.com/topthreadz',
        ],
      },

      // WebSite
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: BRAND_NAME,
        description: SITE_DESCRIPTION,
        publisher: {
          '@id': `${SITE_URL}#organization`,
        },
        inLanguage: 'en-PK',
        potentialAction: [
          {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
          {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        ],
        about: {
          '@type': 'Thing',
          name: 'Men\'s Fashion Clothing',
          description: 'Premium men\'s fashion brand in Pakistan',
        },
        mainEntity: {
          '@id': `${SITE_URL}#organization`,
        },
      },

      // ClothingStore with comprehensive details
      {
        '@type': 'ClothingStore',
        '@id': `${SITE_URL}#store`,
        name: `${BRAND_NAME} Flagship Store`,
        image: [
          heroBanner || `${SITE_URL}/images/topthreadz-store.jpg`,
          `${SITE_URL}/images/topthreadz-store-interior.jpg`,
        ],
        url: SITE_URL,
        telephone: '+92-300-9070520',
        priceRange: 'PKR 2,500 - PKR 25,000',
        currenciesAccepted: 'PKR',
        paymentAccepted: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Mobile Payment'],
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'topthreadz, R28V+R3W, Street 2, DHA Phase 5 Zamzama Commercial Area Defence V',
          addressLocality: 'Karachi',
          addressRegion: 'Sindh',
          postalCode: '75600',
          addressCountry: 'PK',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 24.8197,
          longitude: 67.0396,
        },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday', 'Sunday'],
            opens: '11:00',
            closes: '22:30',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Friday'],
            opens: '14:00',
            closes: '22:30',
          },
        ],
        parentOrganization: {
          '@id': `${SITE_URL}#organization`,
        },
        makesOffer: categories.map((cat: any) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: cat.name,
            description: cat.description || `${cat.name} collection at ${BRAND_NAME}`,
            url: getCategoryUrl(cat),
          },
        })),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Men\'s Fashion Collections',
          itemListElement: categories.map((cat: any, index: number) => ({
            '@type': 'OfferCatalog',
            position: index + 1,
            name: cat.name,
            url: getCategoryUrl(cat),
          })),
        },
      },

      // Brand
      {
        '@type': 'Brand',
        '@id': `${SITE_URL}#brand`,
        name: BRAND_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/images/topthreadz-logo.jpg`,
        description: SITE_DESCRIPTION,
        slogan: 'Premium Men\'s Fashion Since 2020',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: 1250,
          ratingCount: 1250,
        },
      },

      // Category ItemList
      {
        '@type': 'ItemList',
        '@id': `${SITE_URL}#categories-list`,
        name: 'Top Threadz Fashion Collections',
        description: 'Browse our premium men\'s fashion categories',
        itemListElement: categories.map((cat: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: cat.name,
          description: cat.description || `Premium ${cat.name} collection`,
          url: getCategoryUrl(cat),
          image: cat.coverImage || cat.image || `${SITE_URL}/images/category-placeholder.jpg`,
          numberOfItems: getCategoryCount(cat),
        })),
        numberOfItems: categories.length,
      },

      // Product ItemList (first 10)
      {
        '@type': 'ItemList',
        '@id': `${SITE_URL}#products-list`,
        name: 'Latest Products',
        description: 'Newest arrivals at Top Threadz',
        itemListElement: products.slice(0, 10).map((product: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: product.name || `Product ${index + 1}`,
          description: product.description || product.shortDescription || '',
          url: getProductUrl(product),
          image: getProductImage(product),
          price: product.price || product.salePrice,
          priceCurrency: 'PKR',
          availability: product.inStock ? 'InStock' : 'OutOfStock',
          item: {
            '@type': 'Product',
            name: product.name || `Product ${index + 1}`,
            description: product.description || product.shortDescription || '',
            image: getProductImage(product),
            sku: product.sku || product.id || `PROD-${index}`,
            brand: {
              '@type': 'Brand',
              name: BRAND_NAME,
            },
            offers: {
              '@type': 'Offer',
              price: product.price || product.salePrice || 0,
              priceCurrency: 'PKR',
              availability: product.inStock ? 'InStock' : 'OutOfStock',
              url: getProductUrl(product),
            },
          },
        })),
        numberOfItems: Math.min(products.length, 10),
      },

      // Breadcrumb
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}#breadcrumb`,
        name: 'Homepage Breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Shop',
            item: `${SITE_URL}/products`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Men\'s Fashion',
            item: `${SITE_URL}/collections`,
          },
        ],
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
        initialSettings={settings}
      />
    </>
  );
}