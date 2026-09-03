import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.topthreadz.com.pk';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const STATIC_PATHS = ['/', '/products', '/faq', '/delivery', '/returns', '/privacy', '/terms'];

async function fetchAllProducts(): Promise<any[]> {
  const limit = 200;
  let page = 1;
  let all: any[] = [];

  // Loop pages instead of a fixed limit=1000, so the sitemap can't
  // silently drop products once the catalog grows past whatever number
  // someone hardcoded here.
  while (true) {
    const res = await fetch(`${API_URL}/products?limit=${limit}&page=${page}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`products fetch failed: ${res.status}`);
    const json = await res.json();
    const products = json?.data?.products || [];
    all = all.concat(products);

    const pagination = json?.data?.pagination;
    if (!pagination || page >= pagination.totalPages || products.length < limit) break;
    page += 1;

    // Hard stop so a bad totalPages value from the API can't loop forever
    // during the build. 200 pages * 200/page = 40,000 products ceiling —
    // raise this if the catalog ever gets close.
    if (page > 200) break;
  }

  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: 'daily',
    priority: path === '/' ? 1 : 0.7,
  }));

  try {
    const [catsJson, products] = await Promise.all([
      fetch(`${API_URL}/categories`, { next: { revalidate: 300 } }).then((r) => r.json()),
      fetchAllProducts(),
    ]);

    const categories = catsJson?.data || [];

    categories.forEach((c: any) => {
      // Canonical /products/category/[slug] route, NOT /products?category=.
      // That query-string version has no metadata/canonical of its own and
      // would otherwise compete with this page in the index.
      entries.push({
        url: `${SITE_URL}/products/category/${c.slug || encodeURIComponent(c.name)}`,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    });

    products.forEach((p: any) => {
      const lastModified = p.updatedAt ? new Date(p.updatedAt) : undefined;
      entries.push({
        url: `${SITE_URL}/products/${p.slug || p.id}`,
        ...(lastModified && !isNaN(lastModified.getTime()) ? { lastModified } : {}),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  } catch (err) {
    // Swallowing this means the sitemap can quietly ship stale/empty for
    // months. Log it at minimum — wire to your error tracker if you have one.
    console.error('[sitemap] failed to load categories/products, shipping static routes only:', err);
  }

  return entries;
}