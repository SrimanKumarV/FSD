import axios from 'axios';
import toast from 'react-hot-toast';

// ─── Capacitor / Mobile Detection ─────────────────────────────────────────────
// In Capacitor WebView, cookies from cross-origin backends don't work reliably.
// We use localStorage as a token store for the mobile APK.
export const isCapacitor = typeof window !== 'undefined' && Boolean(
  window.Capacitor?.isNativePlatform?.() ||
  window.location.protocol === 'capacitor:' ||
  (window.location.hostname === 'localhost' && window.Capacitor)
);

const TOKEN_KEY = 'alumnex_auth_token';
const HEALTHY_BACKEND_KEY = 'alumnex_last_healthy_backend';

export const mobileTokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  },
  set: (token) => {
    if (token) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch (e) { }
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) { }
  },
};

// ─── Known Scaled Production Backends ─────────────────────────────────────────
// Both active and backup instances are registered here to ensure high availability
// even if build environment variables are missing or misconfigured.
export const KNOWN_PRODUCTION_BACKENDS = [
  'https://alumnex-backend-backup.onrender.com/api',
  'https://alumnex-backend-2.onrender.com/api',
  'https://alumnex-backend-9y5t.onrender.com/api'
];

const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  let clean = url.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api') && !clean.includes('/api/')) {
    clean = `${clean}/api`;
  }
  return clean;
};

export const getAvailableBackendUrls = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const urls = [];

  // Check for runtime dynamic scaling configured in window or localStorage
  if (typeof window !== 'undefined') {
    try {
      if (Array.isArray(window.ALUMNEX_BACKEND_SERVERS)) {
        urls.push(...window.ALUMNEX_BACKEND_SERVERS);
      }
      const runtimeScaled = localStorage.getItem('alumnex_scaled_backends');
      if (runtimeScaled) {
        const parsed = JSON.parse(runtimeScaled);
        if (Array.isArray(parsed)) urls.push(...parsed);
      }
    } catch (e) { }
  }

  // Environment-configured backends
  if (process.env.REACT_APP_API_URL) urls.push(process.env.REACT_APP_API_URL);
  if (process.env.REACT_APP_BACKUP_API_URL) urls.push(process.env.REACT_APP_BACKUP_API_URL);
  if (process.env.REACT_APP_BACKUP_API_URL_2) urls.push(process.env.REACT_APP_BACKUP_API_URL_2);
  if (process.env.REACT_APP_BACKUP_API_URL_3) urls.push(process.env.REACT_APP_BACKUP_API_URL_3);

  // Default known production servers
  urls.push(...KNOWN_PRODUCTION_BACKENDS);

  // In development, also include localhost fallback if no env var was set
  if (isDev && !process.env.REACT_APP_API_URL) {
    urls.unshift('http://localhost:5000/api');
  }

  // Normalize and remove duplicates
  const candidateUrls = Array.from(
    new Set(urls.map(normalizeUrl).filter(Boolean))
  );

  // Prioritize last verified healthy backend if available
  if (typeof window !== 'undefined') {
    try {
      const lastHealthy = localStorage.getItem(HEALTHY_BACKEND_KEY);
      if (lastHealthy && candidateUrls.includes(lastHealthy)) {
        const idx = candidateUrls.indexOf(lastHealthy);
        candidateUrls.splice(idx, 1);
        candidateUrls.unshift(lastHealthy);
      }
    } catch (e) { }
  }

  if (candidateUrls.length === 0) {
    return ['https://alumnex-backend-backup.onrender.com/api'];
  }

  return candidateUrls;
};

// Global state for failover tracking and load balancing
let activeBackendUrls = [...getAvailableBackendUrls()];

export const getActiveBackendUrl = () => activeBackendUrls[0] || 'https://alumnex-backend-backup.onrender.com/api';

export const triggerFailover = (failedUrl) => {
  const currentUrl = failedUrl ? normalizeUrl(failedUrl) : activeBackendUrls[0];

  if (activeBackendUrls.length <= 1) {
    // If only 1 URL in current active list, restore full pool and put failed one at end
    const allCandidates = getAvailableBackendUrls();
    const remaining = allCandidates.filter(u => u !== currentUrl);
    if (remaining.length > 0) {
      activeBackendUrls = [...remaining, currentUrl];
    }
  } else if (activeBackendUrls[0] === currentUrl) {
    // Rotate failed URL to the end of the line
    const failed = activeBackendUrls.shift();
    activeBackendUrls.push(failed);
  }

  const nextUrl = activeBackendUrls[0];
  console.warn(`[Load Balancer] Shifted backend from ${currentUrl} -> ${nextUrl}`);

  try {
    if (api && api.defaults) {
      api.defaults.baseURL = nextUrl;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(HEALTHY_BACKEND_KEY, nextUrl);
    }
  } catch (e) { }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('backend-failover', { detail: nextUrl }));
  }

  return nextUrl;
};

// ─── Startup Background Health Probe ──────────────────────────────────────────
// Quickly tests candidates in the background and promotes the fastest live backend.
export const probeAndSelectFastestBackend = async () => {
  if (typeof window === 'undefined' || activeBackendUrls.length <= 1) return;

  const testServer = async (apiUrl) => {
    const root = apiUrl.replace(/\/api\/?$/, '');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`${root}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      }).catch(() => {
        return fetch(`${root}/`, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store'
        });
      });
      clearTimeout(timer);
      if (res && res.status >= 200 && res.status < 400) {
        return apiUrl;
      }
    } catch (e) {
      clearTimeout(timer);
    }
    return null;
  };

  try {
    const fastest = await Promise.any(
      activeBackendUrls.map(url =>
        testServer(url).then(res => {
          if (!res) throw new Error('Not reachable');
          return res;
        })
      )
    );

    if (fastest && activeBackendUrls[0] !== fastest) {
      console.log(`[Smart Load Balancer] Discovered live responsive backend: ${fastest}`);
      activeBackendUrls = [fastest, ...activeBackendUrls.filter(u => u !== fastest)];
      if (api && api.defaults) {
        api.defaults.baseURL = fastest;
      }
      try {
        localStorage.setItem(HEALTHY_BACKEND_KEY, fastest);
      } catch (e) { }
      window.dispatchEvent(new CustomEvent('backend-failover', { detail: fastest }));
    }
  } catch (err) {
    // Probe silent fallback; request interceptor handles on-demand failover
  }
};

// Initiate non-blocking probe on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    probeAndSelectFastestBackend();
  }, 100);
}

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: activeBackendUrls[0],
  timeout: 25000, // 25s timeout: ample for cold-starts, avoids 60s freeze on mobile
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── Token Refresh / 401 Deduplication ───────────────────────────────────────
let isRefreshing = false;
let pendingRequests = [];

const onTokenRefreshed = (newToken) => {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
};

const onRefreshFailed = () => {
  pendingRequests = [];
};

let csrfTokenMemory = typeof window !== 'undefined' ? (sessionStorage.getItem('alumnex_csrf_token') || null) : null;

export const setCsrfToken = (token) => {
  if (!token || typeof token !== 'string') return;
  csrfTokenMemory = token;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('alumnex_csrf_token', token);
    } catch (e) { }
  }
};

let isInitializingCsrf = false;
export const initCsrfToken = async () => {
  if (typeof window === 'undefined' || isInitializingCsrf) return;
  isInitializingCsrf = true;
  try {
    const backendUrl = getActiveBackendUrl();
    let token = null;

    try {
      const res = await axios.get(`${backendUrl}/csrf-token`, {
        withCredentials: true,
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      token = res.data?.csrfToken || res.headers?.['x-csrf-token'] || res.headers?.['X-CSRF-Token'];
    } catch (e1) {
      try {
        const res = await axios.get(`${backendUrl}/auth/csrf-token`, {
          withCredentials: true,
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        token = res.data?.csrfToken || res.headers?.['x-csrf-token'] || res.headers?.['X-CSRF-Token'];
      } catch (e2) { }
    }

    if (token) {
      setCsrfToken(token);
    }
  } catch (e) {
    // Non-fatal background bootstrap
  } finally {
    isInitializingCsrf = false;
  }
};

// Proactively bootstrap CSRF token in browser environment
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initCsrfToken().catch(() => {});
  }, 100);
}

// ─── Server Unavailability Detector ───────────────────────────────────────────
// Detects when a backend instance is suspended, down, timed out, or returning gateway errors
const isServerUnavailable = (error) => {
  if (!error) return false;
  // Network connection dropped, ECONNABORTED, timeout, or DNS failure
  if (!error.response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
    return true;
  }
  const status = error.response.status;
  // 502 Bad Gateway, 503 Service Unavailable / Suspended, 504 Gateway Timeout, 520-526 Cloudflare errors
  if (status === 502 || status === 503 || status === 504 || (status >= 520 && status <= 526)) {
    return true;
  }
  return false;
};

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Ensure baseURL is aligned with active backend
    if (!config.baseURL || config.baseURL !== activeBackendUrls[0]) {
      config.baseURL = activeBackendUrls[0];
    }

    // ── Universal Token Authentication ──
    const storedToken = mobileTokenStore.get();

    if (storedToken) {
      config.headers['Authorization'] = `Bearer ${storedToken}`;
      config.headers['X-Mobile-App'] = 'capacitor';
    } else {
      const xsrfTokenCookie = typeof document !== 'undefined'
        ? document.cookie
          .split('; ')
          .find((row) => row.startsWith('XSRF-TOKEN='))
          ?.split('=')[1]
        : null;

      const finalToken = xsrfTokenCookie || csrfTokenMemory || (typeof window !== 'undefined' ? sessionStorage.getItem('alumnex_csrf_token') : null);

      if (finalToken) {
        config.headers['X-XSRF-TOKEN'] = finalToken;
        config.headers['X-CSRF-Token'] = finalToken;
      }
    }

    // Bypass ngrok warning screen for local development
    config.headers['ngrok-skip-browser-warning'] = 'true';

    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => {
    const headerToken = response.headers?.['x-csrf-token'] || response.headers?.['X-CSRF-Token'];
    if (headerToken) {
      setCsrfToken(headerToken);
    }

    // Mark current backend as successfully verified
    if (response.config?.baseURL && typeof window !== 'undefined') {
      try {
        localStorage.setItem(HEALTHY_BACKEND_KEY, response.config.baseURL);
      } catch (e) { }
    }

    return response;
  },
  async (error) => {
    const errHeaderToken = error.response?.headers?.['x-csrf-token'] || error.response?.headers?.['X-CSRF-Token'];
    if (errHeaderToken) {
      setCsrfToken(errHeaderToken);
    }

    const originalRequest = error.config || {};

    // ── CSRF Auto-Recovery (Transparent retry on 403 CSRF token mismatch) ──
    const isCsrfError = error.response?.status === 403 &&
      ((typeof error.response?.data?.message === 'string' &&
        error.response.data.message.toLowerCase().includes('csrf')) ||
       error.response?.data?.code === 'CSRF_MISMATCH');

    if (isCsrfError && !originalRequest._retryCsrf) {
      originalRequest._retryCsrf = true;
      console.warn('[api] CSRF validation failed on request. Transparently refreshing token and retrying...');

      let freshToken = errHeaderToken;
      if (!freshToken) {
        try {
          const bootstrapUrl = originalRequest.baseURL || getActiveBackendUrl();
          let csrfRes;
          try {
            csrfRes = await axios.get(`${bootstrapUrl}/csrf-token`, {
              withCredentials: true,
              headers: { 'ngrok-skip-browser-warning': 'true' }
            });
          } catch (e1) {
            csrfRes = await axios.get(`${bootstrapUrl}/auth/csrf-token`, {
              withCredentials: true,
              headers: { 'ngrok-skip-browser-warning': 'true' }
            });
          }
          freshToken = csrfRes.data?.csrfToken || csrfRes.headers?.['x-csrf-token'] || csrfRes.headers?.['X-CSRF-Token'];
        } catch (fetchErr) {
          console.warn('[api] Failed to fetch fallback CSRF token:', fetchErr.message);
        }
      }

      if (freshToken) {
        setCsrfToken(freshToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers['X-XSRF-TOKEN'] = freshToken;
        originalRequest.headers['X-CSRF-Token'] = freshToken;
        return api(originalRequest);
      }
    }

    // ── Client-Side Failover Logic ──
    // Triggers on network drop, timeout, or 502/503/504 Bad Gateway / Service Suspended
    if (isServerUnavailable(error) && !originalRequest._retryFailover) {
      originalRequest._retryFailover = true;
      const currentFailedUrl = originalRequest.baseURL || activeBackendUrls[0];
      const nextUrl = triggerFailover(currentFailedUrl);

      console.warn(`[Failover Retrying] Swapping ${currentFailedUrl} -> ${nextUrl} for ${originalRequest.url}`);

      originalRequest.baseURL = nextUrl;
      if (originalRequest.url && originalRequest.url.startsWith('http')) {
        originalRequest.url = originalRequest.url.replace(currentFailedUrl, nextUrl);
      }

      // Re-dispatch request immediately to the healthy scaled backend
      return api(originalRequest);
    }

    // ── 401: Token expired or invalid ──
    if (error.response?.status === 401 && !originalRequest._retry) {
      const reqUrl = originalRequest.url || '';
      // Do not attempt refresh on auth endpoints to prevent loops
      if (reqUrl.includes('/auth/login') || reqUrl.includes('/auth/refresh') || reqUrl.includes('/auth/register')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((newToken) => {
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {};
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
        const refreshBaseUrl = getActiveBackendUrl();
        const currentToken = mobileTokenStore.get();

        const refreshRes = await axios.post(
          `${refreshBaseUrl}/auth/refresh`,
          { token: currentToken },
          {
            timeout: 15000,
            withCredentials: true,
            headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {}
          }
        );

        const newToken = refreshRes.data?.token;
        if (newToken) {
          mobileTokenStore.set(newToken);
          if (refreshRes.data.user) {
            try {
              localStorage.setItem('alumnex_auth_user', JSON.stringify(refreshRes.data.user));
            } catch (e) {}
          }
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        onTokenRefreshed(newToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFailed();

        const isAuthError = refreshError.response && (refreshError.response.status === 401 || refreshError.response.status === 403);

        if (isAuthError) {
          mobileTokenStore.clear();
          try {
            localStorage.removeItem('alumnex_auth_user');
          } catch (e) {}
          window.dispatchEvent(new Event('auth:logout'));
        } else {
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

    // ── Network / Server unavailable (After failovers have been exhausted) ──
    if (isServerUnavailable(error)) {
      console.warn('All backend servers currently unavailable:', error.message);
      if (!originalRequest._toastShown) {
        toast.error('Network error. Servers are currently unreachable.');
        originalRequest._toastShown = true;
      }
    } else if (error.response?.status >= 500) {
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
