import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import CategoryPageContent from './CategoryPageContent';
import { fetchServerCategories, fetchServerProductsPage } from '@/lib/serverData';
import { SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo';
import { resolveImageUrl } from '@/lib/images';
import {
  getCategorySeoConfig,
  getCategoryDisplayName,
  buildCategoryCanonical,
  getProductHref,
  summarizeProducts,
  buildDataSummaryLine,
} from '@/lib/categorySeo';

interface Props {
  params: Promise<{ slug: string }> | { slug: string };
}

// ISR: category pages are statically generated and revalidated every 5
// minutes, so Googlebot always receives fully-rendered HTML without waiting
// on any client-side fetch.
export const revalidate = 300;

// The priority category URLs are pre-rendered at build time (SSG) so their
// SEO-critical content exists in the initial HTML even on a cold start.
// Other real categories are rendered on-demand and then cached (ISR).
export async function generateStaticParams() {
  return [
    { slug: 'unstitched-fabric' },
    { slug: 'stitched' },
    { slug: 'waist-coats' },
    { slug: 'two-piece' },
    { slug: 'three-piece' },
    { slug: 'kids-section' },
  ];
}

interface CategoryPageData {
  rawSlug: string;
  seo: ReturnType<typeof getCategorySeoConfig>;
  categoryName: string;
  categories: any[];
  matchedCategory: any | null;
  products: any[];
  pagination: any | null;
  bannerUrl: string | null;
}

async function getCategoryPageData(slug: string): Promise<CategoryPageData> {
  const rawSlug = decodeURIComponent(slug || '');
  const categoryName = getCategoryDisplayName(rawSlug);
  const seo = getCategorySeoConfig(rawSlug);

  const [categories, productPage] = await Promise.all([
    fetchServerCategories(),
    fetchServerProductsPage({ category: categoryName, limit: 24, sortBy: 'recommended' }),
  ]);

  const matchedCategory =
    categories.find(
      (c: any) =>
        c.slug?.toLowerCase() === rawSlug.toLowerCase() ||
        c.name?.toLowerCase() === categoryName.toLowerCase()
    ) || null;

  const bannerUrl = matchedCategory
    ? matchedCategory.bannerImage || matchedCategory.coverImage || null
    : null;

  return {
    rawSlug,
    seo,
    categoryName,
    categories,
    matchedCategory,
    products: productPage.products,
    pagination: productPage.pagination,
    bannerUrl,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getCategoryPageData(resolvedParams.slug);
  const { seo, matchedCategory } = data;
  const canonicalUrl = buildCategoryCanonical(resolvedParams.slug);
  const ogImage = matchedCategory?.bannerImage
    || matchedCategory?.coverImage
    || DEFAULT_OG_IMAGE;

  return {
    title: seo.title,
    description: seo.metaDescription,
    keywords: seo.keywords,
    alternates: { canonical: canonicalUrl },
    // Don't index a category slug that doesn't map to anything real.
    robots: { index: !!matchedCategory, follow: true },
    openGraph: {
      type: 'website',
      locale: 'en_PK',
      url: canonicalUrl,
      siteName: 'Top Threadz',
      title: seo.title,
      description: seo.metaDescription,
      images: [{ url: ogImage, width: 1000, height: 1250, alt: seo.h1 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.metaDescription,
      images: [ogImage],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const resolvedParams = await params;
  const data = await getCategoryPageData(resolvedParams.slug);
  const { rawSlug, seo, categoryName, categories, products, pagination, bannerUrl } = data;

  const canonicalUrl = buildCategoryCanonical(resolvedParams.slug);
  const summary = summarizeProducts(products);
  const summaryLine = buildDataSummaryLine(summary);

  // ── Structured data (all server-rendered into the initial HTML) ───────────
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: categoryName, item: canonicalUrl },
    ],
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: seo.h1,
    description: seo.metaDescription,
    url: canonicalUrl,
    isPartOf: { '@type': 'WebSite', name: 'Top Threadz', url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: summary.count,
      itemListElement: products.slice(0, 24).map((product: any, index: number) => {
        const productUrl = `${SITE_URL}${getProductHref(product)}`;
        const image = resolveImageUrl(product.images?.[0] || product.imageMeta?.[0]?.url || '');
        const price = Number(product.price) || 0;
        const discount = Number(product.discount) || 0;
        const effective = Math.round(price * (1 - discount / 100));
        return {
          '@type': 'ListItem',
          position: index + 1,
          url: productUrl,
          item: {
            '@type': 'Product',
            name: String(product.name || '').replace(/\s*\|\s*Top Threadz\s*/i, '').trim(),
            url: productUrl,
            ...(image ? { image } : {}),
            ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
            offers: {
              '@type': 'Offer',
              url: productUrl,
              priceCurrency: 'PKR',
              price: effective,
              availability:
                product.stockStatus === 'OUT_OF_STOCK'
                  ? 'https://schema.org/OutOfStock'
                  : 'https://schema.org/InStock',
            },
          },
        };
      }),
    },
  };

  // Contextual internal links: keep only related slugs that exist as real
  // categories so we never link to a 404. (If the categories list couldn't be
  // loaded, fall back to the curated slugs — they are all real store
  // categories, and unknown slugs simply 307 to /products.)
  const existingSlugs = new Set(
    (categories || []).map((c: any) => String(c.slug || '').toLowerCase())
  );
  const relatedLinks = seo.related.filter(
    (rel) => existingSlugs.size === 0 || existingSlugs.has(rel.slug.toLowerCase())
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <div className="w-full min-h-[70vh] pb-12">
        {/* ── 1. FULL WIDTH CATEGORY BANNER (image only — no text overlays) ── */}
        <div className="w-full mb-4 sm:mb-6">
          {bannerUrl ? (
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-surface-100 dark:bg-[#1A1D24]">
              <Image
                src={resolveImageUrl(bannerUrl)}
                alt={`${categoryName} Collection`}
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
              <h1 className="sr-only">{seo.h1}</h1>
            </div>
          ) : (
            /* Editorial fallback banner with gold accent & premium styling. */
            <div className="relative w-full aspect-[4/1] min-h-[170px] sm:min-h-[250px] md:min-h-[330px] overflow-hidden bg-gradient-to-r from-[#0B1528] via-[#122240] to-[#0B1528] flex items-center justify-center text-center px-4">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#D4A84B] to-transparent" />
              <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-[#D4A84B]/10 blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-[#D4A84B]">
                  TOP THREADZ COLLECTION
                </span>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-white uppercase">
                  {categoryName}
                </h1>
                <p className="text-xs sm:text-sm text-white/70 tracking-wider font-light max-w-xl mx-auto">
                  Fine fabric, cut to your signature look.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
          {/* ── 2. BREADCRUMB (server-rendered, crawlable links) ── */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-[13px] text-surface-600 dark:text-surface-400 mb-3 sm:mb-4">
            <Link href="/" className="hover:text-surface-950 dark:hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-surface-400 dark:text-surface-500 font-light">&gt;</span>
            <Link href="/products" className="hover:text-surface-950 dark:hover:text-white transition-colors">
              Products
            </Link>
            <span className="text-surface-400 dark:text-surface-500 font-light">&gt;</span>
            <span className="font-semibold text-surface-900 dark:text-white truncate">
              {categoryName}
            </span>
          </nav>

          {/* ── 3. PRODUCT GRID (client interactivity, SSR initial data) ── */}
          <CategoryPageContent
            slug={resolvedParams.slug}
            initialProducts={products}
            initialPagination={pagination}
            bannerUrl={bannerUrl}
          />

          {/* ── 4. END-OF-GRID COLLECTION DESCRIPTION (Matches Diners reference) ── */}
          {seo.endDescription && (
            <section
              className="mt-8 sm:mt-12 md:mt-14 w-full text-left"
              aria-label={`${categoryName} Collection Overview`}
            >
              {seo.collectionTitle && (
                <h2 className="text-sm sm:text-base font-display font-semibold text-surface-900 dark:text-white mb-2 tracking-tight">
                  {seo.collectionTitle}
                </h2>
              )}
              <p className="text-xs sm:text-[13px] md:text-sm leading-relaxed text-surface-600 dark:text-surface-400 font-normal text-justify">
                {seo.endDescription}
              </p>
            </section>
          )}

          {/* ── 5. CONTEXTUAL INTERNAL LINKS (server-rendered) ── */}
          {relatedLinks.length > 0 && (
            <section className="mt-12 pt-8 border-t border-surface-200 dark:border-[#2D3340]">
              <h2 className="text-sm sm:text-base font-display font-bold text-surface-950 dark:text-white">
                Explore More Collections at Top Threadz
              </h2>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {relatedLinks.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/products/category/${rel.slug}`}
                    className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-full border border-surface-200 dark:border-[#2D3340] bg-white dark:bg-[#1A1D24] text-surface-700 dark:text-surface-300 hover:border-surface-400 dark:hover:border-[#3A4250] hover:text-surface-950 dark:hover:text-white transition-colors"
                  >
                    {rel.name}
                  </Link>
                ))}
                <Link
                  href="/products"
                  className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-full border border-surface-200 dark:border-[#2D3340] bg-white dark:bg-[#1A1D24] text-surface-700 dark:text-surface-300 hover:border-surface-400 dark:hover:border-[#3A4250] hover:text-surface-950 dark:hover:text-white transition-colors"
                >
                  All Products
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

