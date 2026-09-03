import type { MetadataRoute } from 'next';

const SITE_URL = 'https://www.topthreadz.com.pk';

// Defined once and reused everywhere below. Previously each bot group had
// its own copy of this array — if a new sensitive path got added to only
// the "*" group, bots with their own explicit group (Googlebot, Bingbot...)
// would NOT inherit it, since a matching named group overrides "*" entirely
// rather than merging with it. That's how a path meant to be hidden from
// everyone quietly stays visible to Googlebot specifically.
const DISALLOW = [
  '/cart',
  '/checkout',
  '/orders',
  '/login',
  '/register',
  '/account',
  '/wishlist',
  '/compare',
  '/api/',
  '/_next/',
  '/admin/',
  '/dashboard/',
  '/profile/',
  '/settings/',
  // Parameterized listing URLs (?category=, ?search=, ?sortBy=) aren't
  // blocked from crawling elsewhere and generate near-infinite near-duplicate
  // combinations of /products. The canonical, properly-metadata'd category
  // pages already live at /products/category/[slug] — no reason to let
  // crawlers burn budget on the query-string variants too.
  '/products?*',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: 'Googlebot', allow: '/', disallow: DISALLOW }, // crawlDelay is ignored by Google — omitted intentionally
      { userAgent: 'Googlebot-Image', allow: '/' },
      { userAgent: 'Googlebot-Video', allow: '/' },
      { userAgent: 'Bingbot', allow: '/', disallow: DISALLOW, crawlDelay: 2 },
      { userAgent: 'Yahoo! Slurp', allow: '/', disallow: DISALLOW, crawlDelay: 2 },
      { userAgent: 'Yandex', allow: '/', disallow: DISALLOW, crawlDelay: 3 },
      { userAgent: 'YandexImages', allow: '/', crawlDelay: 3 },
      { userAgent: 'DuckDuckBot', allow: '/', disallow: DISALLOW, crawlDelay: 2 },
      { userAgent: 'Baiduspider', allow: '/', disallow: DISALLOW, crawlDelay: 5 },
      { userAgent: 'Sogou', allow: '/', disallow: DISALLOW, crawlDelay: 3 },
      { userAgent: 'Exabot', allow: '/', disallow: DISALLOW, crawlDelay: 3 },
      { userAgent: 'facebookexternalhit', allow: '/', disallow: DISALLOW },
      { userAgent: 'Twitterbot', allow: '/', disallow: DISALLOW },
      { userAgent: 'LinkedInBot', allow: '/', disallow: DISALLOW },
      { userAgent: 'Pinterestbot', allow: '/', disallow: DISALLOW },
      { userAgent: 'WhatsApp', allow: '/', disallow: DISALLOW },
      { userAgent: 'Applebot', allow: '/', disallow: DISALLOW, crawlDelay: 2 }, // was "AppleBot" — correct token is "Applebot"
      // SEO-tool crawlers (Ahrefs/Semrush/MJ12) don't send you traffic, only
      // scrape backlink/keyword data — often for competitors. Left allowed
      // with a heavy crawl delay below; if you'd rather they see nothing at
      // all, swap `disallow: DISALLOW` for `disallow: '/'` on these three.
      { userAgent: 'SemrushBot', allow: '/', disallow: DISALLOW, crawlDelay: 5 },
      { userAgent: 'AhrefsBot', allow: '/', disallow: DISALLOW, crawlDelay: 5 },
      { userAgent: 'MJ12bot', allow: '/', disallow: DISALLOW, crawlDelay: 5 },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}