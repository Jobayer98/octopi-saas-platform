import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true, // send cookies (refresh token)
});

// Attach access token from memory store
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const AUTH_ROUTES = ["/auth/refresh", "/auth/login", "/auth/forgot-password", "/auth/reset-password"];

let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const url = original?.url ?? "";
    // Never attempt silent refresh for auth endpoints themselves
    const isAuthEndpoint = AUTH_ROUTES.some((r) => url.includes(r));
    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true });
        const newToken: string = data.accessToken;
        tokenStore.set(newToken);
        queue.forEach((cb) => cb(newToken));
        queue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        tokenStore.clear();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// In-memory token store (not localStorage — avoids XSS exposure)
export const tokenStore = (() => {
  let token: string | null = null;
  return {
    get: () => token,
    set: (t: string) => { token = t; },
    clear: () => { token = null; },
  };
})();

export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.message ?? err.message;
  }
  return "An unexpected error occurred";
}
