const getApiBaseUrl = () => {
  let url = (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://www.topthreadz.com.pk/api'
  ).trim();
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

export async function fetchServerData<T>(endpoint: string, revalidate = 60): Promise<T | null> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      next: { revalidate },
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    return (data?.data ?? data) as T;
  } catch {
    // If backend is unreachable during build or cold start, gracefully return null
    return null;
  }
}

export async function fetchServerProduct(idOrSlug: string) {
  return fetchServerData<any>(`/products/${encodeURIComponent(idOrSlug)}`, 30);
}

export async function fetchServerCategories() {
  const data = await fetchServerData<any[]>('/categories', 120);
  return Array.isArray(data) ? data : [];
}

export async function fetchServerProducts(params?: { limit?: number; sortBy?: string; category?: string; featured?: boolean; trending?: boolean }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.category) query.set('category', params.category);
  if (params?.featured) query.set('featured', 'true');
  if (params?.trending) query.set('trending', 'true');

  const endpoint = `/products?${query.toString()}`;
  const data = await fetchServerData<any>(endpoint, 30);
  return data?.products || (Array.isArray(data) ? data : []);
}

/**
 * Like fetchServerProducts but also returns the API pagination block, so the
 * category page can server-render the product grid AND seed the client-side
 * infinite query with correct has-more state (no skeleton flash on hydration).
 */
export async function fetchServerProductsPage(params?: { limit?: number; sortBy?: string; category?: string }): Promise<{ products: any[]; pagination: any | null }> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.category) query.set('category', params.category);

  const endpoint = `/products?${query.toString()}`;
  const data = await fetchServerData<any>(endpoint, 30);
  const products = data?.products || (Array.isArray(data) ? data : []);
  return {
    products,
    pagination: data?.pagination || null,
  };
}


export async function fetchServerHomepageSettings(revalidate = 120) {
  let data = await fetchServerData<any>('/settings/homepage', revalidate);
  if (!data) {
    data = await fetchServerData<any>('/admin/settings/homepage', revalidate);
  }
  return data || null;
}

export async function fetchServerHeroBanner() {
  const hp = await fetchServerHomepageSettings();
  const url = hp?.heroBanner?.desktop?.url;
  if (url) return url;
  const data = await fetchServerData<any>('/settings/hero-banner', 120);
  return data?.url as string | undefined;
}

export async function fetchServerHeroBanners() {
  const data = await fetchServerData<any[]>('/admin/hero-banners', 120);
  return Array.isArray(data) ? data : [];
}

export async function fetchServerHeroBannerMobile() {
  const hp = await fetchServerHomepageSettings();
  const url = hp?.heroBanner?.mobile?.url;
  if (url) return url;
  const data = await fetchServerData<any>('/settings/hero-banner-mobile', 120);
  return (data?.url as string | undefined) ?? null;
}

export async function fetchServerProductsBanner() {
  const hp = await fetchServerHomepageSettings();
  return hp?.productsBanner || null;
}

export async function fetchServerStoreSettings() {
  return fetchServerData<any>('/settings/store', 120);
}

export async function fetchServerHeroBannerText() {
  const hp = await fetchServerHomepageSettings();
  if (hp?.heroBanner) {
    return {
      heading: hp.heroBanner.heading,
      subheading: hp.heroBanner.subheading,
      buttonText: hp.heroBanner.buttonText,
      buttonLink: hp.heroBanner.buttonLink,
    };
  }
  const data = await fetchServerData<any>('/settings/hero-banner-text', 120);
  return data || null;
}

export interface SiteLogo {
  url?: string;
  header?: string;
  footerLogo?: string;
  faviconUrl?: string;
  faviconPng?: string;
  faviconIco?: string;
  dark?: { url?: string; header?: string; footer?: string; small?: string } | null;
  light?: { url?: string; header?: string; footer?: string; small?: string } | null;
  footer?: { url?: string; header?: string; footer?: string; small?: string } | null;
  favicon?: { url?: string; header?: string; footer?: string; small?: string } | null;
}

export async function fetchServerSiteLogo(): Promise<SiteLogo | null> {
  return fetchServerData<SiteLogo>('/settings/logo', 120);
}
