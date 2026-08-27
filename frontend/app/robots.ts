import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/cart', '/checkout', '/orders', '/login'] }, sitemap: 'https://www.topthreadz.com.pk/sitemap.xml' };
}
