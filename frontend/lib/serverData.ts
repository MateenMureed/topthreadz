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

export async function fetchServerHeroBanner() {
  const data = await fetchServerData<any>('/settings/hero-banner', 120);
  return data?.url as string | undefined;
}

export async function fetchServerHeroBanners() {
  const data = await fetchServerData<any[]>('/admin/hero-banners', 120);
  return Array.isArray(data) ? data : [];
}

export async function fetchServerStoreSettings() {
  return fetchServerData<any>('/settings/store', 120);
}
