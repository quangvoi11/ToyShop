import axios from 'axios';
import { store } from '../store';
import { tokenRefreshed, removeSession } from '../store/slices/authSlice';

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

function syncSessionToken(accessToken: string, refreshToken: string) {
  const activeRole = localStorage.getItem('active_role');
  const raw = localStorage.getItem('auth_sessions');
  if (activeRole && raw) {
    try {
      const sessions = JSON.parse(raw);
      if (sessions[activeRole]) {
        sessions[activeRole].accessToken = accessToken;
        sessions[activeRole].refreshToken = refreshToken;
        localStorage.setItem('auth_sessions', JSON.stringify(sessions));
      }
    } catch {
      // ignore malformed storage
    }
  }
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
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

        syncSessionToken(newAccess, newRefresh);
        store.dispatch(tokenRefreshed({ accessToken: newAccess, refreshToken: newRefresh }));

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch {
        refreshPromise = null;

        const activeRole = localStorage.getItem('active_role');
        if (activeRole) {
          store.dispatch(removeSession(activeRole));
          const hasRemaining = Object.keys(store.getState().auth.sessions).length > 0;
          if (!hasRemaining) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('auth_sessions');
          localStorage.removeItem('active_role');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }
    return Promise.reject(error);
  },
);

export default api;
