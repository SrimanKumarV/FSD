import axios from 'axios';
import toast from 'react-hot-toast';

const getBaseUrl = () => {
  if (process.env.REACT_APP_API_URL && !process.env.REACT_APP_API_URL.includes('localhost')) {
    return process.env.REACT_APP_API_URL;
  }
  return `http://${window.location.hostname}:5000/api`;
};

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000, // Increased to 60s to allow Render free tier to wake up
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
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
    // Token is now handled automatically by the browser via HTTP-only cookies
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    // ── Client-Side Failover Logic ──
    // If the request fails due to network error or timeout (Render sleeping)
    const isNetworkOrTimeout = !error.response || error.code === 'ECONNABORTED';
    
    if (isNetworkOrTimeout && !originalRequest._retryFailover) {
      const backupUrl = process.env.REACT_APP_BACKUP_API_URL;
      
      if (backupUrl) {
        originalRequest._retryFailover = true;
        console.warn(`Primary API failed or timed out. Failing over to backup: ${backupUrl}`);
        
        // Swap the base URL to Koyeb (or any backup)
        originalRequest.baseURL = backupUrl;
        
        // Retry the request instantly on the backup server
        return api(originalRequest);
      }
    }

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
        // Attempt silent token refresh via cookie (no auth header needed)
        
        // Use the current base URL for refresh, which could be the backup if we failed over
        const refreshBaseUrl = originalRequest.baseURL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        
        await axios.post(
          `${refreshBaseUrl}/auth/refresh`,
          {},
          { timeout: 10000, withCredentials: true }
        );

        // Replay the original request (cookie will be sent automatically)
        onTokenRefreshed('refreshed');
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFailed();

        // Only clear session and redirect if the refresh explicitly failed due to an auth issue (401/403)
        // If it failed because of a network timeout or 500 error, we shouldn't log the user out!
        const isAuthError = refreshError.response && (refreshError.response.status === 401 || refreshError.response.status === 403);
        
        if (isAuthError) {
          window.dispatchEvent(new Event('auth:logout'));
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }, 100);
        } else {
          // It was a network or server error during refresh, just show a network error toast
          console.warn('Network error during token refresh:', refreshError.message);
          if (!originalRequest._toastShown) {
            toast.error('Network error. Servers are currently unreachable.');
            originalRequest._toastShown = true;
          }
        }
        return Promise.reject(error);
      }
    }

    // ── 403: Forbidden (don't redirect, just log) ──
    if (error.response?.status === 403) {
      console.warn('Access denied:', error.response.data?.message);
    }

    // ── Network / timeout errors (After failover has also failed) ──
    if (isNetworkOrTimeout) {
      console.warn('Network error or server unavailable:', error.message);
      if (!originalRequest._toastShown) {
        toast.error('Network error. Servers are currently unreachable.');
        originalRequest._toastShown = true;
      }
    }

    // ── 5xx: Server errors ──
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.status, error.response.data?.message);
      if (!originalRequest._toastShown) {
        toast.error('Server error. Please try again later.');
        originalRequest._toastShown = true;
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
