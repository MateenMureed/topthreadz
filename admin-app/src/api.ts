import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default API URL pointing to production backend
export const DEFAULT_API_URL = 'https://topthreadz-d94j.vercel.app/api';

class ApiService {
  private baseUrl: string = DEFAULT_API_URL;
  private token: string | null = null;

  async init() {
    try {
      const savedUrl = await AsyncStorage.getItem('topthreadz_api_url');
      if (savedUrl) this.baseUrl = savedUrl.trim().replace(/\/+$/, '');
      const savedToken = await AsyncStorage.getItem('topthreadz_admin_token');
      if (savedToken) this.token = savedToken;
    } catch (e) {
      console.warn('Failed to load initial settings from AsyncStorage', e);
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async setBaseUrl(newUrl: string) {
    let clean = newUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) clean += '/api';
    this.baseUrl = clean;
    await AsyncStorage.setItem('topthreadz_api_url', clean);
  }

  getToken(): string | null {
    return this.token;
  }

  async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('topthreadz_admin_token', token);
    } else {
      await AsyncStorage.removeItem('topthreadz_admin_token');
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
