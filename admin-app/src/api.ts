import axios from 'axios';

// ---------------------------------------------------------------------------
// Pure in-memory storage — works in Expo Go without any native modules.
// Token persists for the lifetime of the JS process (session).
// ---------------------------------------------------------------------------
class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

export const safeStorage = new MemoryStorage();

// Default API URL pointing to production backend
export const DEFAULT_API_URL = 'https://topthreadz-d94j.vercel.app/api';

class ApiService {
  private baseUrl: string = DEFAULT_API_URL;
  private token: string | null = null;

  /** Call once on app boot — reads from in-memory store (no-op on fresh start). */
  async init() {
    const savedUrl = safeStorage.getItem('topthreadz_api_url');
    if (savedUrl) this.baseUrl = savedUrl.trim().replace(/\/+$/, '');
    const savedToken = safeStorage.getItem('topthreadz_admin_token');
    if (savedToken) this.token = savedToken;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(newUrl: string) {
    let clean = newUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) clean += '/api';
    this.baseUrl = clean;
    safeStorage.setItem('topthreadz_api_url', clean);
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      safeStorage.setItem('topthreadz_admin_token', token);
    } else {
      safeStorage.removeItem('topthreadz_admin_token');
    }
  }

  private getClient() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return axios.create({
      baseURL: this.baseUrl,
      headers,
      timeout: 20000,
    });
  }

  async get(endpoint: string, params?: any) {
    const client = this.getClient();
    const res = await client.get(endpoint, { params });
    return res.data;
  }

  async post(endpoint: string, data?: any) {
    const client = this.getClient();
    const res = await client.post(endpoint, data);
    return res.data;
  }

  async postFormData(endpoint: string, formData: FormData) {
    const headers: Record<string, string> = {
      'Content-Type': 'multipart/form-data',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    const client = axios.create({
      baseURL: this.baseUrl,
      headers,
      timeout: 60000,
    });
    const res = await client.post(endpoint, formData);
    return res.data;
  }

  async put(endpoint: string, data?: any) {
    const client = this.getClient();
    const res = await client.put(endpoint, data);
    return res.data;
  }

  async patch(endpoint: string, data?: any) {
    const client = this.getClient();
    const res = await client.patch(endpoint, data);
    return res.data;
  }

  async delete(endpoint: string) {
    const client = this.getClient();
    const res = await client.delete(endpoint);
    return res.data;
  }
}

export const api = new ApiService();
