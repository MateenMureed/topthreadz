import api from './api';

export interface SocialAuthProviders {
  google: boolean;
  facebook: boolean;
}

export const authService = {
  signup: (data: { name: string; email: string; phone: string; password: string }) =>
    api.post('/auth/signup', data).then(r => r.data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then(r => r.data),

  logout: () =>
    api.post('/auth/logout').then(r => r.data),

  session: () => api.get('/auth/session').then(r => r.data),

  getOAuthProviders: (): Promise<{ success: boolean; data: SocialAuthProviders }> =>
    api.get('/auth/providers').then(r => r.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data).then(r => r.data),
};
