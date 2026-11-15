const rateLimit = require('express-rate-limit');

/**
 * Alumnex Connect — Authentication Rate Limiters
 * Protects authentication, registration, OTP generation, and password reset endpoints.
 */

// 1. Login Limiter: 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts from this IP address. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_LOGIN'
  }
});

// 2. Registration Limiter: 10 registrations per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many account registration attempts. Please try again later.',
    code: 'RATE_LIMIT_REGISTER'
  }
});

// 3. OTP Dispatch Limiter: 5 OTP requests per 15 minutes per IP
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification code requests. Please wait 15 minutes before requesting another code.',
    code: 'RATE_LIMIT_OTP_SEND'
  }
});

// 4. OTP Verification Limiter: 10 verification attempts per 15 minutes per IP
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many code verification attempts. Please wait 15 minutes before trying again.',
    code: 'RATE_LIMIT_OTP_VERIFY'
  }
});

// 5. Password Reset Request Limiter: 5 requests per 15 minutes per IP
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please wait 15 minutes before trying again.',
    code: 'RATE_LIMIT_PASSWORD_RESET'
  }
});

// 6. File Upload Limiter: 30 uploads per 15 minutes per IP
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'File upload rate limit reached. Please wait before uploading more files.',
    code: 'RATE_LIMIT_UPLOAD'
  }
});

// 7. Public HelpDesk Submission Limiter: 10 inquiries per 15 minutes per IP
const helpdeskLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many support submissions. Please wait 15 minutes before submitting another inquiry.',
    code: 'RATE_LIMIT_HELPDESK'
  }
});

// 8. Search Endpoint Limiter: 60 search queries per minute per IP
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Search query rate limit reached. Please slow down your requests.',
    code: 'RATE_LIMIT_SEARCH'
  }
});

// 9. Expensive External URL / Profile Extraction Limiter: 5 extractions per 15 minutes per IP
const extractionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Profile extraction rate limit reached. Please wait 15 minutes before extracting again.',
    code: 'RATE_LIMIT_EXTRACTION'
  }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  passwordResetLimiter,
  uploadLimiter,
  helpdeskLimiter,
  searchLimiter,
  extractionLimiter
};
