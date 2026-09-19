import { NextRequest, NextResponse } from 'next/server';

/**
 * Duplicate-URL prevention (SEO): /products?category=...&sortBy=... style
 * URLs are filtered views of /products and must not compete with the canonical
 * /products/category/[slug] pages in Google's index. robots.txt already
 * disallows `/products?*`; this adds a belt-and-braces `X-Robots-Tag: noindex`
 * on the response itself, so even a crawler that ignores robots.txt never
 * indexes a filtered variant.
 */
const FILTER_KEYS = [
  'category',
  'subcategory',
  'search',
  'sortBy',
  'brand',
  'collection',
  'minPrice',
  'maxPrice',
  'size',
  'color',
  'gender',
];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === '/products') {
    const hasFilter = FILTER_KEYS.some((key) => searchParams.has(key));
    if (hasFilter) {
      const response = NextResponse.next();
      response.headers.set('X-Robots-Tag', 'noindex, follow');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/products'],
};
