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

  // Validate CSRF token from header on state-changing requests
  const headerToken = req.headers['x-xsrf-token'];
  
  if (!headerToken || headerToken !== token) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('CSRF token missing or invalid, bypassing in development mode.');
      return next();
    }
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }

  next();
};

module.exports = csrfProtection;
