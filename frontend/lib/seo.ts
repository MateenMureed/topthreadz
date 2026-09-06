import type { Metadata } from 'next';

export const SITE_URL = 'https://www.topthreadz.com.pk';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/topthreadz-logo.jpg`;

/**
 * Self-canonical metadata for public indexable pages. Prevents the
 * "Alternate page with proper canonical tag" issue by letting each page
 * declare its own canonical URL instead of inheriting the homepage's.
 */
export function publicPageMetadata(path: string, title: string, description: string): Metadata {
  const url = `${SITE_URL}${path === '/' ? '' : path}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      url,
      siteName: 'Top Threadz',
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * noindex metadata for utility pages (cart, login, orders, account) that
 * must never enter the search index but shouldn't be blocked in robots.txt
 * (so they can still be crawled for link discovery if linked).
 */
export function noindexMetadata(title: string): Metadata {
  return {
    title,
    robots: {
      index: false,
      follow: true,
    },
  };
}
