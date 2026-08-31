import type { Metadata } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Providers } from '@/lib/providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import Breadcrumbs from '@/components/Breadcrumbs';
import AuthRouteHandler from '@/components/AuthRouteHandler';
import WhatsAppButton from '@/components/WhatsAppButton';
import { STANDARD_SEO_TAGS } from '@/lib/standardProductDetails';
import './globals.css';

const CartDrawer = dynamic(() => import('@/components/CartDrawer'));
const AuthModal = dynamic(() => import('@/components/AuthModal'));

export const metadata: Metadata = {
  metadataBase: new URL('https://www.topthreadz.com.pk'),
  verification: {
    google: 'h2s93E-7aU8K0vVK_RxrpR-ps_P7ylL0oop_o3qCSJw',
  },
  title: {
    default: 'Top Threadz | Official Store | Unstitched & Stitched Men\'s Fabric Pakistan',
    template: '%s | Top Threadz',
  },
  description: 'Official Top Threadz Store. Shop premium unstitched men\'s fabric in Pakistan. Visit our flagship store at Zamzama Commercial Area DHA Phase 5 Karachi. Free delivery nationwide on orders over PKR 10,000.',
  keywords: [
    'Top Threadz',
    'Top Threadz Zamzama',
    'Top Threadz Karachi',
    'Top Threadz DHA Phase 5',
    'Top Threadz Zamzama Commercial Area',
    'Top Threadz Karachi Outlet',

    'topthreadz.com.pk',
    'topthreadz',
    'men unstitched fabric Pakistan',
    'wash n wear suit',
    '4.5 meter men suit',
    'boski fabric karachi',
    'R28V+R3W Karachi',
    ...STANDARD_SEO_TAGS,
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://www.topthreadz.com.pk/',
    siteName: 'Top Threadz',
    title: 'Top Threadz | Official Store | Premium Men\'s Fabric Pakistan',
    description: 'Official Top Threadz online store and flagship retail outlet at Zamzama DHA Phase 5 Karachi. Premium wash n wear, Boski, and formal fabrics with nationwide free delivery over 10k.',
    images: [
      {
        url: '/images/topthreadz-logo.jpg',
        width: 1024,
        height: 512,
        alt: 'Top Threadz Official Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top Threadz | Official Store | Men\'s Fabric Pakistan',
    description: 'Official Top Threadz online store. Flagship outlet at Zamzama DHA Phase 5 Karachi. Free shipping over PKR 10,000.',
    images: ['/images/topthreadz-logo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon-full-512.png',
  },
  category: 'fashion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // LocalBusiness schema for Top Threadz Zamzama Karachi Flagship Outlet
  const zamzamaStoreJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    '@id': 'https://www.topthreadz.com.pk/#zamzama-store',
    name: 'Top Threadz - Zamzama Karachi Outlet',
    alternateName: ['Top Threadz Zamzama', 'Top Threadz Karachi', 'Top Threadz DHA Phase 5'],
    url: 'https://www.topthreadz.com.pk/',
    logo: 'https://www.topthreadz.com.pk/images/topthreadz-logo.png',
    image: 'https://www.topthreadz.com.pk/images/topthreadz-logo.jpg',
    description: 'Top Threadz Flagship Store at Zamzama Commercial Area Karachi. Offering premium unstitched menswear fabrics, Boski, and blended wash n wear suits.',
    telephone: '+92-300-9070520',
    email: 'support@topthreadz.pk',
    priceRange: 'PKR 2,500 - PKR 15,000',
    currenciesAccepted: 'PKR',
    paymentAccepted: 'Cash, Credit Card, Debit Card, Online Transfer',
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
    hasMap: 'https://maps.google.com/?q=R28V%2BR3W,+Street+2,+DHA+Phase+5+Zamzama+Commercial+Area+Defence+V+Karachi,+75600,+Pakistan',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '11:00',
        closes: '22:30',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Sunday',
        opens: '14:00',
        closes: '22:00',
      },
    ],

    sameAs: [
      'https://www.topthreadz.com.pk',
      'https://www.facebook.com/topthreadz',
      'https://www.instagram.com/topthreadz',
    ],
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://www.topthreadz.com.pk/#organization',
    name: 'Top Threadz',
    alternateName: ['Top Threadz Pakistan', 'Top Threadz Official Store'],
    url: 'https://www.topthreadz.com.pk/',
    logo: 'https://www.topthreadz.com.pk/images/topthreadz-logo.png',
    email: 'support@topthreadz.pk',
    telephone: '+92-300-9070520',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'topthreadz, R28V+R3W, Street 2, DHA Phase 5 Zamzama Commercial Area Defence V',
      addressLocality: 'Karachi',
      addressRegion: 'Sindh',
      postalCode: '75600',
      addressCountry: 'PK',
    },
    sameAs: [
      'https://www.topthreadz.com.pk',
      'https://www.facebook.com/topthreadz',
      'https://www.instagram.com/topthreadz',
    ],
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://www.topthreadz.com.pk/#website',
    name: 'Top Threadz',
    alternateName: 'Top Threadz Official Store',
    url: 'https://www.topthreadz.com.pk',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.topthreadz.com.pk/products?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en" className="scroll-smooth light" style={{ colorScheme: 'light' }}>
      <body className="min-h-screen flex flex-col bg-[#fafafa] text-surface-900">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(zamzamaStoreJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <Providers>
          <Suspense fallback={null}>
            <AuthRouteHandler />
          </Suspense>
          <Navbar />
          <main className="flex-1 pt-16 pb-24 lg:pb-0">
            <Suspense fallback={null}>
              <Breadcrumbs />
            </Suspense>
            {children}
          </main>
          <Footer />
          <MobileNav />
          <CartDrawer />
          <AuthModal />
          <WhatsAppButton />
        </Providers>
        <div id="plusCursor" aria-hidden="true" />
      </body>
    </html>
  );
}
