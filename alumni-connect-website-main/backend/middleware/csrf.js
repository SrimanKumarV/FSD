const crypto = require('crypto');

/**
 * Custom Double-Submit Cookie CSRF Protection Middleware
 * - Generates a CSRF token and sets it in an XSRF-TOKEN cookie (accessible to JS).
 * - On state-changing requests, verifies the X-XSRF-TOKEN header matches the cookie.
 */
const csrfProtection = (req, res, next) => {
  // Generate a token if one doesn't exist in the cookies
  let token = req.cookies['XSRF-TOKEN'];
  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Must be false so frontend JS can read it
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
  }
  // Set header for cross-origin frontend to read
  res.setHeader('X-CSRF-Token', token);

  // Safe methods don't need CSRF validation
  const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (isSafeMethod) {
    return next();
  }

  // Mobile apps (Capacitor) use Authorization: Bearer token instead of cookies
  // They cannot read cross-origin cookies anyway, so CSRF is bypassed.
  if (req.headers['x-mobile-app'] === 'capacitor') {
    return next();
  }

  // Public unauthenticated routes & external webhooks do not have an existing authenticated session.
  // We exempt them from CSRF blocking so initial authentication (login, registration, forgot-password, OAuth)
  // succeeds seamlessly, while still issuing the XSRF-TOKEN cookie & header for subsequent protected requests.
  const exemptPaths = [
    '/api/auth/login',
    '/auth/login',
    '/api/auth/register',
    '/auth/register',
    '/api/auth/refresh',
    '/auth/refresh',
    '/api/auth/forgot-password',
    '/auth/forgot-password',
    '/api/auth/reset-password',
    '/auth/reset-password',
    '/api/auth/google',
    '/auth/google',
    '/api/auth/github',
    '/auth/github',
    '/api/auth/oauth-complete',
    '/auth/oauth-complete',
    '/api/auth/verify-email',
    '/auth/verify-email',
    '/api/auth/resend-verification',
    '/auth/resend-verification',
    '/api/auth/send-2fa',
    '/auth/send-2fa',
    '/api/auth/verify-2fa',
    '/auth/verify-2fa',
    '/api/auth/csrf-token',
    '/auth/csrf-token',
    '/api/csrf-token',
    '/csrf-token',
    '/api/google-calendar/webhook',
    '/google-calendar/webhook',
    '/api/notifications/devices/unregister',
    '/notifications/devices/unregister'
  ];

  const rawPath = (req.originalUrl ? req.originalUrl.split('?')[0] : req.path) || '';
  const currentPath = rawPath.toLowerCase().replace(/\/+$/, '');
  const isExempt = exemptPaths.some(p => {
    const norm = p.toLowerCase().replace(/\/+$/, '');
    return currentPath === norm || currentPath.endsWith(norm);
  });

  if (isExempt) {
    return next();
  }

  // Validate CSRF token from header on state-changing requests
  const headerToken = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];
  
  if (!headerToken || headerToken !== token) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[CSRF] Warning: CSRF token missing or mismatch on ${req.method} ${currentPath}. Bypassing in development mode.`);
      return next();
    }
    return res.status(403).json({ message: 'Invalid CSRF token', code: 'CSRF_MISMATCH' });
  }

  next();
};

module.exports = csrfProtection;
