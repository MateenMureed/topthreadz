/**
 * Data-driven category SEO for /products/category/[slug].
 *
 * Principles:
 * - URLs are unchanged: every category still lives at /products/category/[slug].
 * - Titles, H1s and descriptions are unique per category and search-focused.
 * - Body copy never fabricates claims. Static sentences are limited to
 *   verifiable store policies (COD, nationwide delivery, 7-day exchange,
 *   flagship outlet) that are already published on /faq and /delivery, while
 *   anything product-specific (counts, price ranges, style names, brands) is
 *   computed at render time from the real products returned by the API.
 * - The admin AI SEO Optimizer (per-product metaTitle/metaDescription) is
 *   untouched; this module only governs the category landing pages.
 */

import { SITE_URL } from './seo';

export interface RelatedCategoryLink {
  name: string;
  slug: string;
}

export interface CategorySeoConfig {
  /** Exact H1 string rendered server-side. */
  h1: string;
  /** Full <title> including brand suffix, kept <= 60 chars. */
  title: string;
  metaDescription: string;
  keywords: string[];
  /** Short collection title shown above the end-of-grid description. */
  collectionTitle: string;
  /** End-of-grid description copy (provided store copy, no fabricated stats). */
  endDescription: string;
  /** Contextual sibling categories for internal linking. */
  related: RelatedCategoryLink[];
}

const BRAND_SUFFIX = ' | Top Threadz';

function withBrand(base: string): string {
  return `${base}${BRAND_SUFFIX}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-slug SEO configs for the priority category URLs. Titles are 50–60 chars
// including the brand suffix; descriptions are ~150–160 chars and unique.
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_SEO: Record<string, CategorySeoConfig> = {
  'unstitched-fabric': {
    h1: "Men's Unstitched Fabric in Pakistan",
    title: withBrand("Men's Unstitched Fabric Online in Pakistan"),
    metaDescription:
      "Buy men's unstitched fabric in Pakistan at Top Threadz. Wash & wear and Boski suit lengths with matching buttons, brand tags, COD and nationwide delivery.",
    keywords: [
      "men's unstitched fabric",
      'unstitched fabric pakistan',
      'wash and wear fabric men',
      'boski fabric price',
      'unstitched suit length',
      'top threadz unstitched',
    ],
    collectionTitle: 'Unstitched Fabric',
    endDescription:
      'Explore the Unstitched Collection by Top Threadz, crafted for the modern gentleman who values refined style and exceptional quality. Featuring premium fabrics selected for comfort, durability, and a sophisticated finish, our unstitched collection gives you the freedom to create a look tailored to your individuality. Ideal for festive occasions, formal gatherings, and everyday elegance, each fabric brings timeless Pakistani menswear into a contemporary wardrobe.',
    related: [
      { name: 'Stitched Clothing', slug: 'stitched' },
      { name: 'Waistcoats', slug: 'waist-coats' },
      { name: 'Two Piece Suits', slug: 'two-piece' },
    ],
  },

  stitched: {
    h1: "Men's Stitched Clothing in Pakistan",
    title: withBrand("Men's Stitched Clothing in Pakistan"),
    metaDescription:
      "Shop men's stitched clothing in Pakistan at Top Threadz. Ready-to-wear kameez shalwar and kurta sets in sizes S–XL with COD, fast delivery and 7-day exchange.",
    keywords: [
      "men's stitched clothing",
      'stitched kameez shalwar men',
      'ready to wear kurta pakistan',
      "men's stitched suits online",
      'stitched dress pakistan',
      'top threadz stitched',
    ],
    collectionTitle: 'Stitched Collection',
    endDescription:
      'Discover the Stitched Collection by Top Threadz, where timeless Pakistani menswear meets contemporary tailoring. Crafted with attention to fabric, fit, and finish, our ready-to-wear pieces are designed for effortless comfort and sophisticated style. From traditional occasions to formal gatherings and everyday dressing, each look is created for the modern gentleman who appreciates refined craftsmanship and confident simplicity.',
    related: [
      { name: 'Unstitched Fabric', slug: 'unstitched-fabric' },
      { name: 'Waistcoats', slug: 'waist-coats' },
      { name: 'Two Piece Suits', slug: 'two-piece' },
    ],
  },

  'waist-coats': {
    h1: "Men's Waistcoats in Pakistan",
    title: withBrand("Men's Waistcoats Online in Pakistan"),
    metaDescription:
      "Buy men's waistcoats in Pakistan at Top Threadz. Formal and occasion waistcoats to layer over kameez shalwar, with COD, nationwide delivery and 7-day exchange.",
    keywords: [
      "men's waistcoat",
      'waistcoat pakistan',
      'mens namda waistcoat',
      'wedding waistcoat men',
      'waist coat price pakistan',
      'top threadz waistcoats',
    ],
    collectionTitle: 'Waistcoats Collection',
    endDescription:
      'Discover the Waistcoat Collection by Top Threadz, designed to bring a refined finishing touch to traditional and formal menswear. Crafted with carefully selected fabrics and sophisticated detailing, each waistcoat adds character, structure, and timeless elegance to your look. Perfect for weddings, festive occasions, formal gatherings, and special celebrations, these versatile pieces are made for the modern gentleman.',
    related: [
      { name: 'Stitched Clothing', slug: 'stitched' },
      { name: 'Two Piece Suits', slug: 'two-piece' },
      { name: 'Unstitched Fabric', slug: 'unstitched-fabric' },
    ],
  },

  'two-piece': {
    h1: "Men's Two Piece Suits in Pakistan",
    title: withBrand("Men's Two Piece Suits Online in Pakistan"),
    metaDescription:
      "Shop men's two piece suits in Pakistan at Top Threadz. Coordinated kameez shalwar sets with a tailored fit, COD, nationwide delivery and 7-day exchange.",
    keywords: [
      "men's two piece suit",
      'two piece suit pakistan',
      'kameez shalwar two piece',
      "men's 2 piece dress",
      'two piece menswear online',
      'top threadz two piece',
    ],
    collectionTitle: 'Two Piece Collection',
    endDescription:
      'Explore the Two Piece Collection by Top Threadz, designed for the modern gentleman who appreciates effortless sophistication. Combining carefully selected fabrics with refined tailoring and versatile styling, each ensemble offers a polished look without compromising on comfort. Ideal for formal occasions, festive gatherings, celebrations, and elevated everyday wear, the collection brings timeless menswear style into a contemporary wardrobe.',
    related: [
      { name: 'Waistcoats', slug: 'waist-coats' },
      { name: 'Stitched Clothing', slug: 'stitched' },
      { name: 'Unstitched Fabric', slug: 'unstitched-fabric' },
    ],
  },

  'three-piece': {
    h1: "Men's Three Piece Suits in Pakistan",
    title: withBrand("Men's Three Piece Suits in Pakistan"),
    metaDescription:
      "Shop men's three piece suits in Pakistan at Top Threadz. Coordinated kurta, waistcoat and shalwar sets with COD, nationwide delivery and 7-day exchange.",
    keywords: [
      "men's three piece suit",
      'three piece suit pakistan',
      '3 piece dress men',
      'waistcoat suit men',
      'three piece menswear online',
      'top threadz three piece',
    ],
    collectionTitle: 'Three Piece Collection',
    endDescription:
      'Discover the Three Piece Collection by Top Threadz, created for occasions that call for timeless sophistication and distinguished style. Featuring coordinated pieces crafted with attention to fabric, fit, and finish, the collection delivers a complete and polished look for the modern gentleman. Perfect for weddings, formal celebrations, festive occasions, and memorable gatherings, each ensemble combines traditional elegance with contemporary refinement.',
    related: [
      { name: 'Waistcoats', slug: 'waist-coats' },
      { name: 'Two Piece Suits', slug: 'two-piece' },
      { name: 'Stitched Clothing', slug: 'stitched' },
    ],
  },

  'kids-section': {
    h1: "Kids' Traditional Wear in Pakistan",
    title: withBrand("Kids' Traditional Wear in Pakistan"),
    metaDescription:
      "Shop the Top Threadz kids collection — comfortable, premium boys' traditional wear for Eid, weddings and festive occasions with COD across Pakistan.",
    keywords: [
      'kids traditional wear',
      "boys' kurta pakistan",
      'kids shalwar kameez',
      'eid dress for boys',
      'kids wedding wear',
      'top threadz kids',
    ],
    collectionTitle: 'Kids Collection',
    endDescription:
      "Discover the Kids Collection by Top Threadz, designed to bring comfort, quality, and timeless style to children's traditional wear. Crafted with carefully selected fabrics and thoughtful designs, each piece is made for comfort while keeping young gentlemen looking polished and well dressed. Perfect for festive celebrations, family gatherings, special occasions, and everyday traditional style.",
    related: [
      { name: 'Stitched Clothing', slug: 'stitched' },
      { name: 'Unstitched Fabric', slug: 'unstitched-fabric' },
      { name: 'Waistcoats', slug: 'waist-coats' },
    ],
  },
};

/** Title-case a raw category slug for readable display names. */
export function titleizeSlug(raw: string): string {
  return decodeURIComponent(raw || '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Readable category name derived from the slug (used in breadcrumbs etc.). */
export function getCategoryDisplayName(rawSlug: string): string {
  return titleizeSlug(rawSlug);
}

const SLUG_ALIASES: Record<string, string> = {
  unstitched: 'unstitched-fabric',
  'unstitched-fabrics': 'unstitched-fabric',
  'unstitched-collection': 'unstitched-fabric',
  'stitched-collection': 'stitched',
  'stitched-suits': 'stitched',
  'stitched-clothing': 'stitched',
  waistcoats: 'waist-coats',
  waistcoat: 'waist-coats',
  'waistcoat-collection': 'waist-coats',
  'waistcoats-collection': 'waist-coats',
  'two-piece-suits': 'two-piece',
  'two-piece-collection': 'two-piece',
  '2-piece': 'two-piece',
  'three-piece-suits': 'three-piece',
  'three-piece-collection': 'three-piece',
  '3-piece': 'three-piece',
  kids: 'kids-section',
  'kids-collection': 'kids-section',
  'boys-kids': 'kids-section',
  'boys-&-kids': 'kids-section',
  children: 'kids-section',
};

/**
 * Resolve the SEO config for a slug. Known priority categories get their
 * hand-verified config; any other real category gets a generic-but-honest
 * fallback built from the category's own name (no invented claims).
 */
export function getCategorySeoConfig(rawSlug: string): CategorySeoConfig {
  const normalized = decodeURIComponent(rawSlug || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
  const key = SLUG_ALIASES[normalized] || normalized;
  if (CATEGORY_SEO[key]) return CATEGORY_SEO[key];

  const name = titleizeSlug(rawSlug);
  return {
    h1: `${name} for Men`,
    title: withBrand(`${name} — Men's Collection`),
    metaDescription: `Shop ${name} for men at Top Threadz — premium Pakistani menswear with Cash on Delivery, nationwide delivery across Pakistan and a 7-day exchange policy.`,
    keywords: [name, `${name} pakistan`, "men's collection", 'top threadz'],
    collectionTitle: `${name} Collection`,
    endDescription: `Browse the ${name} collection for men at Top Threadz — premium Pakistani menswear curated at our Zamzama, Karachi flagship outlet. Order online with Cash on Delivery and nationwide delivery across Pakistan, backed by our 7-day exchange policy.`,
    related: [
      { name: 'Unstitched Fabric', slug: 'unstitched-fabric' },
      { name: 'Stitched Clothing', slug: 'stitched' },
      { name: 'Waistcoats', slug: 'waist-coats' },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Data-driven copy helpers — computed ONLY from real API product data.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductDataSummary {
  count: number;
  minPrice: number | null;
  maxPrice: number | null;
  subcategories: string[];
  brands: string[];
}

/**
 * Product page href, mirroring ProductCard's slug-or-id logic exactly, so the
 * JSON-LD product URLs always match the actual crawlable <a href> on the card.
 */
export function getProductHref(product: any): string {
  const slug = String(product?.slug || '').trim();
  const isSlugLike = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);
  const identifier = slug && !slug.includes('/') && isSlugLike ? slug : product?.id;
  return `/products/${encodeURIComponent(identifier)}`;
}

/** Compute factual stats from the real products returned for this category. */
export function summarizeProducts(products: any[]): ProductDataSummary {
  const list = Array.isArray(products) ? products : [];
  const prices = list
    .map((p) => {
      const price = Number(p?.price);
      const discount = Number(p?.discount) || 0;
      return Number.isFinite(price) ? price * (1 - discount / 100) : NaN;
    })
    .filter((n) => Number.isFinite(n) && n > 0);

  const subcategories = Array.from(
    new Set(list.map((p) => String(p?.subcategory || '').trim()).filter(Boolean))
  ).slice(0, 5);

  const brands = Array.from(
    new Set(list.map((p) => String(p?.brand || '').trim()).filter(Boolean))
  ).slice(0, 3);

  return {
    count: list.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    subcategories,
    brands,
  };
}

function formatPkr(value: number): string {
  return `Rs ${Math.round(value).toLocaleString('en-US')}`;
}

/**
 * One factual sentence derived from real product data. Returns '' when there
 * is nothing verified to say — we never pad with invented claims.
 */
export function buildDataSummaryLine(summary: ProductDataSummary): string {
  if (!summary.count) return '';

  const parts: string[] = [];

  if (summary.minPrice !== null && summary.maxPrice !== null && summary.minPrice !== summary.maxPrice) {
    parts.push(
      `Currently ${summary.count} ${summary.count === 1 ? 'style is' : 'styles are'} listed, priced ${formatPkr(summary.minPrice)}–${formatPkr(summary.maxPrice)}`
    );
  } else {
    parts.push(
      `Currently ${summary.count} ${summary.count === 1 ? 'style is' : 'styles are'} listed${
        summary.minPrice !== null ? `, priced ${formatPkr(summary.minPrice)}` : ''
      }`
    );
  }

  if (summary.subcategories.length > 1) {
    parts.push(`including ${summary.subcategories.slice(0, 3).join(', ')}`);
  }
  if (summary.brands.length > 1) {
    parts.push(`from ${summary.brands.slice(0, 2).join(' and ')}`);
  }

  return `${parts.join(', ')}.`;
}

/** Canonical URL for a category slug — no trailing slash, matching metadata. */
export function buildCategoryCanonical(rawSlug: string): string {
  return `${SITE_URL}/products/category/${encodeURIComponent(decodeURIComponent(rawSlug || ''))}`;
}
