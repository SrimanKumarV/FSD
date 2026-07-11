import axios from 'axios';
import toast from 'react-hot-toast';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // 60s to handle Render cold starts
  headers: { 'Content-Type': 'application/json' },
});

// ─── Token Refresh / 401 Deduplication ───────────────────────────────────────
// Tracks whether a token refresh is already in progress so concurrent 401s
// don't all trigger simultaneous redirects or refresh attempts.
let isRefreshing = false;
let pendingRequests = []; // callbacks waiting for a new token

const onTokenRefreshed = (newToken) => {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
};

const onRefreshFailed = () => {
  pendingRequests = [];
};

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── 401: Token expired or invalid ──
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If already refreshing, queue this request to retry once done
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        // Attempt silent token refresh
        const currentToken = localStorage.getItem('token');
        if (!currentToken) throw new Error('No token');

        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${currentToken}` }, timeout: 10000 }
        );

        const newToken = data.token;
        localStorage.setItem('token', newToken);

        // Replay the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        onTokenRefreshed(newToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear session and redirect once
        isRefreshing = false;
        onRefreshFailed();

        // Only clear and redirect if there's actually a stored session to clear
        if (localStorage.getItem('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Dispatch a custom event so AuthContext can react cleanly
          window.dispatchEvent(new Event('auth:logout'));
          // Small delay to let pending state updates settle before redirect
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }, 100);
        }
        return Promise.reject(error);
      }
    }

    // ── 403: Forbidden (don't redirect, just log) ──
    if (error.response?.status === 403) {
      console.warn('Access denied:', error.response.data?.message);
    }

    // ── Network / timeout errors ──
    if (!error.response) {
      // Server unreachable or timed out
      console.warn('Network error or server unavailable:', error.message);
      if (!error.config._toastShown) {
        toast.error('Network error. Please check your connection.');
        error.config._toastShown = true;
      }
    }

    // ── 5xx: Server errors ──
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.status, error.response.data?.message);
      if (!error.config._toastShown) {
        toast.error('Server error. Please try again later.');
        error.config._toastShown = true;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Parallel Request Helper ──────────────────────────────────────────────────
// Wrapper around Promise.allSettled so multiple concurrent requests don't crash
// the whole page if one fails. Returns { data, error } per request.
export const fetchParallel = async (requests) => {
  const results = await Promise.allSettled(requests.map((fn) => fn()));
  return results.map((result) =>
    result.status === 'fulfilled'
      ? { data: result.value?.data, error: null }
      : { data: null, error: result.reason }
  );
};

export { api };
export default api;
