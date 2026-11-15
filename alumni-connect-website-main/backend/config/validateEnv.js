/**
 * Alumnex Connect — Environment Configuration Validator
 * Validates required production secrets at server boot.
 * Fails closed in production if critical security secrets are absent or weak.
 * NEVER prints unmasked secret values to logs or console.
 */

function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  // 1. JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    if (isProduction) {
      errors.push('CRITICAL: JWT_SECRET environment variable is missing.');
    } else {
      warnings.push('JWT_SECRET is not configured. Authentication will fail if not set.');
    }
  } else if (jwtSecret.length < 32 && isProduction) {
    errors.push('CRITICAL: JWT_SECRET must be at least 32 characters in production.');
  }

  // 2. MONGODB_URI
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri && isProduction) {
    errors.push('CRITICAL: MONGODB_URI must be configured in production (cannot fallback to localhost).');
  }

  // 3. ENCRYPTION_KEY
  const encryptionKey = (process.env.ENCRYPTION_KEY || process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY)?.trim();
  if (!encryptionKey) {
    if (isProduction) {
      errors.push('CRITICAL: Dedicated ENCRYPTION_KEY (or GOOGLE_CALENDAR_ENCRYPTION_KEY) must be configured in production.');
    } else {
      warnings.push('ENCRYPTION_KEY is not set; using an ephemeral session key for development.');
    }
  }

  // 4. Optional Service Diagnostics (Safe, masked logs only)
  const servicesStatus = {
    cloudinary: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
    firebaseAdmin: Boolean(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY),
    googleOAuth: Boolean(process.env.GOOGLE_CLIENT_ID),
    webPush: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    mailer: Boolean((process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY) || (process.env.EMAIL_USER && process.env.EMAIL_PASS)),
    redis: Boolean(process.env.REDIS_URL)
  };

  console.log('[ConfigCheck] Environment validation report:');
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Cloudinary: ${servicesStatus.cloudinary ? 'Configured' : 'Optional / Disabled'}`);
  console.log(`  Firebase FCM: ${servicesStatus.firebaseAdmin ? 'Configured' : 'Optional / Unset'}`);
  console.log(`  Google OAuth: ${servicesStatus.googleOAuth ? 'Configured' : 'Optional / Unset'}`);
  console.log(`  Web Push (VAPID): ${servicesStatus.webPush ? 'Configured' : 'Optional / Disabled'}`);
  console.log(`  Mailer: ${servicesStatus.mailer ? 'Configured' : 'Optional / Simulated'}`);
  console.log(`  Redis Cache: ${servicesStatus.redis ? 'Configured' : 'Disabled (Local Memory)'}`);

  for (const warning of warnings) {
    console.warn(`[ConfigCheck] Warning: ${warning}`);
  }

  if (errors.length > 0) {
    for (const err of errors) {
      console.error(`[ConfigCheck] ${err}`);
    }
    if (isProduction) {
      throw new Error(`Production startup aborted due to missing critical environment secrets: ${errors.join('; ')}`);
    }
  }
}

module.exports = validateEnv;
