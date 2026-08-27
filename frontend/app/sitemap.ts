import type { MetadataRoute } from 'next';
const base = 'https://www.topthreadz.com.pk';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = ['/','/products','/faq','/delivery','/returns','/privacy','/terms'].map(path => ({ url: `${base}${path}`, changeFrequency: 'daily', priority: path === '/' ? 1 : 0.7 }));
  try {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const [cats, products] = await Promise.all([fetch(`${api}/categories`, { next: { revalidate: 300 } }).then(r => r.json()), fetch(`${api}/products?limit=1000`, { next: { revalidate: 300 } }).then(r => r.json())]);
    (cats.data || []).forEach((c: any) => entries.push({ url: `${base}/products?category=${encodeURIComponent(c.name)}`, priority: 0.6 }));
    (products.data?.products || []).forEach((p: any) => entries.push({ url: `${base}/products/${p.slug || p.id}`, lastModified: p.updatedAt, priority: 0.7 }));
  } catch { /* sitemap remains valid if API is unavailable during build */ }
  return entries;
}
