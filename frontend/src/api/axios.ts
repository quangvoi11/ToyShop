import axios from 'axios';

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

let refreshPromise: Promise<{ data: { data: { accessToken: string } } }> | null = null;

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

        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        refreshPromise = null;

        try {
          const sessionsRaw = localStorage.getItem('auth_sessions');
          const activeRole = localStorage.getItem('active_role');
          if (sessionsRaw && activeRole) {
            const sessions = JSON.parse(sessionsRaw);
            delete sessions[activeRole];

            const remaining = Object.keys(sessions);
            if (remaining.length > 0) {
              const newRole = remaining[0];
              localStorage.setItem('auth_sessions', JSON.stringify(sessions));
              localStorage.setItem('active_role', newRole);
              localStorage.setItem('accessToken', sessions[newRole].accessToken);
              localStorage.setItem('refreshToken', sessions[newRole].refreshToken);
              localStorage.setItem('user', JSON.stringify(sessions[newRole].user));
              return Promise.reject(error);
            }
          }
        } catch {
          // fall through to full cleanup
        }

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('auth_sessions');
        localStorage.removeItem('active_role');
        window.location.href = '/login';
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
