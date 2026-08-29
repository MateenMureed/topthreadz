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

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const csrf = readCookie('csrf_token');
  if (csrf && !['get', 'head', 'options'].includes((config.method || 'get').toLowerCase())) config.headers['X-CSRF-Token'] = csrf;
  return config;
});

export default api;
