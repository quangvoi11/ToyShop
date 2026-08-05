import axios, { InternalAxiosRequestConfig } from 'axios';
import { store } from '../store';
import { tokenRefreshed } from '../store/slices/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<{ data: { data: { accessToken: string; refreshToken: string } } }> | null = null;

const AUTH_ENDPOINTS = /\/auth\/(login|register|refresh|logout|forgot-password|reset-password|change-password|verify-email|resend-verification)$/;

function isAuthEndpoint(url?: string): boolean {
  return !!url && AUTH_ENDPOINTS.test(url);
}

function clearStoredSession(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('auth_sessions');
  localStorage.removeItem('active_role');
}

function redirectToPortalLogin(): void {
  let redirectTo = '/login';
  try {
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (user && (user.role === 'ADMIN' || user.role === 'STAFF')) redirectTo = '/admin/login';
  } catch {
    // ignore
  }
  clearStoredSession();
  window.location.href = redirectTo;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint(originalRequest.url)) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) throw new Error('No refresh token');

          refreshPromise = axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
            { refreshToken },
          );
        }

        const { data } = await refreshPromise;
        refreshPromise = null;

        const newAccess = data.data.accessToken;
        const newRefresh = data.data.refreshToken;

        store.dispatch(tokenRefreshed({ accessToken: newAccess, refreshToken: newRefresh }));

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch {
        refreshPromise = null;
        redirectToPortalLogin();
        return Promise.reject(error);
      }
    }

    if (error.response?.data?.message) {
      error.message = error.response.data.message;
      if (error.response.data.code) {
        error.code = error.response.data.code;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
