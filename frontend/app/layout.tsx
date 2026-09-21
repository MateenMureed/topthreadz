import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Inter, Outfit, Playfair_Display } from 'next/font/google';
import { Providers } from '@/lib/providers';
import AuthRouteHandler from '@/components/AuthRouteHandler';
import AppLayoutShell from '@/components/AppLayoutShell';
import Analytics from '@/components/Analytics';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
  weight: ['500', '700'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

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
  description: 'Shop premium men\'s unstitched fabric, wash & wear suits and stitched wear at Top Threadz — nationwide delivery across Pakistan.',

  // NOTE: no global canonical here. A layout-level canonical is inherited by
  // every page that doesn't define its own, which told Google all pages were
  // duplicates of the homepage ("Alternate page with proper canonical tag").
  // Each page/layout now declares its own self-canonical.
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
  // Favicon / PWA — SVG is listed first so modern browsers (Chrome, Firefox,
  // Edge) pick it up with priority. The SVG already has embedded light/dark
  // switching via a <style> media query — no black box, clean TT mark.
  // favicon.ico stays last as the legacy fallback for IE / very old browsers.
  icons: {
    icon: [
      // SVG first — modern browsers honour this and it handles light/dark natively
      { url: '/favicon.svg', type: 'image/svg+xml' },
      // PNG fallbacks for browsers that don't support SVG favicons
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      // ICO last — legacy fallback only
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  category: 'fashion',
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#000000' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
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
    email: 'mail@topthreadz.pk',
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
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '23:59',
      },
    ],

    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '1250',
      ratingCount: '1250',
      bestRating: '5',
      worstRating: '1',
    },
    sameAs: [
      'https://www.topthreadz.com.pk',
      'https://www.facebook.com/p/Top-Threadz-100090096882903/',
      'https://www.instagram.com/top.threadz/',
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
    image: 'https://www.topthreadz.com.pk/images/topthreadz-logo.png',
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
      'https://www.facebook.com/p/Top-Threadz-100090096882903/',
      'https://www.instagram.com/top.threadz/',
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
    <html
      lang="en"
      className={`scroll-smooth ${inter.variable} ${outfit.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      {/* Anti-flash: runs synchronously before first paint to apply saved theme */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('topthreadz_theme');if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.add('light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.className} min-h-screen flex flex-col`}
        style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(zamzamaStoreJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <Providers>
          <Suspense fallback={null}>
            <AuthRouteHandler />
          </Suspense>
          <AppLayoutShell>
            {children}
          </AppLayoutShell>
          <CartDrawer />
          <AuthModal />
          {/* GA4 + Facebook Pixel (loads only when env IDs are set) */}
          <Analytics />
        </Providers>
        <div id="plusCursor" aria-hidden="true" />
      </body>
    </html>
  );
}