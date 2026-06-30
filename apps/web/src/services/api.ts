import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const apiBaseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL:         apiBaseURL,
  withCredentials: true,
  timeout:         30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor — attach access token ──
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — handle 401 ─────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${apiBaseURL}/auth/refresh`, {}, { withCredentials: true });
        useAuthStore.getState().setAccessToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);


export default api;
