// lib/seo.ts
// Central place for building titles, descriptions and keywords so every
// page (product, category, listing) produces them the same way.

export const SITE_URL = 'https://www.topthreadz.com.pk';
export const SITE_NAME = 'Top Threadz';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/topthreadz-logo.jpg`;

export function stripHtml(html: string = ''): string {
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildDescription(product: { description?: string; name: string }): string {
  const clean = stripHtml(product.description || '');
  if (clean.length > 20) {
    return `${clean.slice(0, 150)}... Buy online at Top Threadz with cash on delivery across Pakistan.`;
  }
  return `Buy ${product.name} at Top Threadz. Premium Pakistani men's fabric. Fast delivery nationwide.`;
}

/**
 * Turns the admin "keywords" field (comma-separated string OR array) into a
 * clean array for Next.js metadata, and always appends brand/category
 * fallback terms so a product is never left with zero keywords even if the
 * admin field is empty.
 *
 * THIS is the piece that was missing from generateMetadata() before —
 * the product schema/admin form has a `keywords` field, but nothing ever
 * read it when building the page <meta name="keywords"> or passed it into
 * the JSON-LD. That's why keywords typed in the admin never "appeared".
 */
export function buildKeywords(product: {
  keywords?: string | string[] | null;
  name?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
}): string[] {
  const raw = product.keywords;
  let fromAdmin: string[] = [];

  if (Array.isArray(raw)) {
    fromAdmin = raw;
  } else if (typeof raw === 'string') {
    fromAdmin = raw.split(',');
  }

  const fallback = [
    product.name,
    product.category,
    product.subcategory,
    product.brand || 'Top Threadz',
    'Pakistani menswear',
    'unstitched fabric',
  ];

  const combined = [...fromAdmin, ...fallback]
    .map((k) => (k || '').trim())
    .filter(Boolean);

  // de-dupe case-insensitively, keep first-seen casing
  const seen = new Set<string>();
  return combined.filter((k) => {
    const key = k.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** priceValidUntil should roll forward, not sit hardcoded at a fixed year */
export function oneYearFromNow(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}
