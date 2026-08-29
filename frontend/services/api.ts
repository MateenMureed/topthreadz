import axios from 'axios';

const readCookie = (name: string) => typeof document === 'undefined' ? undefined : document.cookie.split('; ').find((value) => value.startsWith(`${name}=`))?.split('=').slice(1).join('=');

const getNormalizedApiUrl = () => {
  let url = (process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || 'http://localhost:5000/api').trim();
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

const API_URL = getNormalizedApiUrl();
let csrfToken: string | undefined;
let csrfTokenRequest: Promise<string | undefined> | undefined;

const cacheCsrfToken = (value: unknown) => {
  if (typeof value === 'string' && value.length > 0) csrfToken = value;
};

async function getCsrfToken(): Promise<string | undefined> {
  if (csrfToken || typeof window === 'undefined') return csrfToken;
  if (!csrfTokenRequest) {
    csrfTokenRequest = axios.get(`${API_URL}/auth/csrf`, { withCredentials: true })
      .then((response) => {
        cacheCsrfToken(response.data?.data?.csrfToken);
        return csrfToken;
      })
      .catch(() => undefined)
      .finally(() => { csrfTokenRequest = undefined; });
  }
  return csrfTokenRequest;
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  const publicAuthRoute = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password']
    .some((route) => String(config.url || '').startsWith(route));
  if (['get', 'head', 'options'].includes(method) || publicAuthRoute) return config;
  return getCsrfToken().then((token) => {
    // On a cross-site deployment the CSRF cookie is correctly scoped to the
    // backend host and cannot be read by the storefront JavaScript.
    const csrf = token || readCookie('csrf_token');
    if (csrf) config.headers['X-CSRF-Token'] = csrf;
    return config;
  });
});

api.interceptors.response.use((response) => {
  cacheCsrfToken(response.data?.data?.csrfToken);
  return response;
});

export default api;
