import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// In production (Vercel), use relative /api — Vercel rewrites proxy these to NEXT_PUBLIC_API_URL
// In local dev, NEXT_PUBLIC_API_URL=http://localhost:5000 so we append /api
let apiBaseURL: string;
if (process.env.NEXT_PUBLIC_API_URL) {
  let base = process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  if (!base.endsWith('/api')) {
    base = base + '/api';
  }
  apiBaseURL = base;
} else {
  // No env variable set — use relative path (Vercel rewrite will handle it)
  apiBaseURL = '/api';
}

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

// Helper to recursively inject legacy _id field wherever id field exists
function injectLegacyIds(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  
  // Safety check: only traverse plain objects or arrays (not Blobs, Files, etc.)
  const proto = Object.getPrototypeOf(data);
  if (proto !== Object.prototype && proto !== Array.prototype) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(injectLegacyIds);
  }
  
  const obj: any = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      obj[key] = injectLegacyIds(data[key]);
    }
  }
  
  // Inject legacy _id if id exists and _id does not
  if (obj.id && !obj._id) {
    obj._id = obj.id;
  }
  
  // Inject standard id if _id exists and id does not
  if (obj._id && !obj.id) {
    obj.id = obj._id;
  }
  
  return obj;
}

// ── Response Interceptor — handle 401 & Inject _id ─────────
api.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = injectLegacyIds(response.data);
    }
    return response;
  },
  async (error) => {
    // Format Pydantic validation error objects into clean, readable strings
    if (error.response?.data) {
      const data = error.response.data;
      if (Array.isArray(data.detail)) {
        const formatted = data.detail
          .map((err: any) => {
            const path = Array.isArray(err.loc) ? err.loc.filter((l: any) => l !== 'body' && l !== 'query').join('.') : '';
            return path ? `${path}: ${err.msg}` : err.msg;
          })
          .join(', ');
        data.detail = formatted || 'Validation error';
      } else if (typeof data.detail === 'object' && data.detail !== null) {
        data.detail = (data.detail as any).msg || JSON.stringify(data.detail);
      }
    }

    const originalRequest = error.config;

    const isAuthRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        const token = useAuthStore.getState().accessToken;
        const { data } = await axios.post(
          `${apiBaseURL}/auth/refresh`,
          {},
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            withCredentials: true,
          }
        );
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
