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
    default: 'Top Threadz | Unstitched Men\'s Fabric in Pakistan',
    template: '%s | Top Threadz',
  },
  description: 'Shop premium unstitched men\'s fabric in Pakistan. Explore Boski-inspired 4.5 meter blended wash n wear suits with formal plain weave and soft finish for all seasons.',
  keywords: [
    'Top Threadz',
    'topthreadz.com.pk',
    'men unstitched fabric Pakistan',
    'wash n wear suit',
    '4.5 meter men suit',
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
    title: 'Top Threadz | Unstitched Men\'s Fabric in Pakistan',
    description: 'Premium unstitched men\'s clothing and fabric for formal and all-season wear in Pakistan.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Top Threadz | Unstitched Men\'s Fabric in Pakistan',
    description: 'Formal blended wash n wear, plain weave, soft-finish unstitched menswear for all seasons.',
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
  category: 'fashion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Top Threadz',
    alternateName: 'Top Threadz Pakistan',
    url: 'https://www.topthreadz.com.pk/',
    email: 'support@topthreadz.com.pk',
    sameAs: [
      'https://www.topthreadz.com.pk',
    ],
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Top Threadz',
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
