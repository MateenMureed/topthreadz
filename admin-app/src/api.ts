import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Robust cross-platform storage helper utilizing Expo's official SecureStore with web & memory fallbacks
class StorageHelper {
  private memory = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
        return this.memory.get(key) || null;
      }
      return await SecureStore.getItemAsync(key);
    } catch {
      return this.memory.get(key) || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        } else {
          this.memory.set(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      this.memory.set(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        } else {
          this.memory.delete(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch {
      this.memory.delete(key);
    }
  }
}

export const safeStorage = new StorageHelper();

// Default API URL pointing to production backend
export const DEFAULT_API_URL = 'https://topthreadz-d94j.vercel.app/api';

class ApiService {
  private baseUrl: string = DEFAULT_API_URL;
  private token: string | null = null;

  async init() {
    try {
      const savedUrl = await safeStorage.getItem('topthreadz_api_url');
      if (savedUrl) this.baseUrl = savedUrl.trim().replace(/\/+$/, '');
      const savedToken = await safeStorage.getItem('topthreadz_admin_token');
      if (savedToken) this.token = savedToken;
    } catch (e) {
      console.warn('Failed to load initial settings from storage', e);
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async setBaseUrl(newUrl: string) {
    let clean = newUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) clean += '/api';
    this.baseUrl = clean;
    await safeStorage.setItem('topthreadz_api_url', clean);
  }

  getToken(): string | null {
    return this.token;
  }

  async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await safeStorage.setItem('topthreadz_admin_token', token);
    } else {
      await safeStorage.removeItem('topthreadz_admin_token');
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
