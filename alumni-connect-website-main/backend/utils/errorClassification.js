/**
 * Alumnex Connect — Central Error Taxonomy & Classification Engine
 * 
 * CORE ARCHITECTURAL PRINCIPLE:
 * Internal System / Provider Failure
 *         ↓
 * Raw Technical Error
 *         ↓
 * Error Classifier & Redactor
 *    ┌────┴──────────────────────────┐
 *    ↓                               ↓
 * User-Safe UX                  Admin Diagnostics
 * Calm, reassuring,             Full structured context,
 * actionable, non-technical     masked secrets, root-cause guidance
 */

const crypto = require('crypto');

// ─── ERROR TAXONOMY CATEGORIES ────────────────────────────────────────────────
const CATEGORIES = {
  USER_ACTION_REQUIRED: 'USER_ACTION_REQUIRED',
  AUTHORIZATION_REQUIRED: 'AUTHORIZATION_REQUIRED',
  TEMPORARY_SERVICE_FAILURE: 'TEMPORARY_SERVICE_FAILURE',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK_FAILURE: 'NETWORK_FAILURE',
  CONFIGURATION_FAILURE: 'CONFIGURATION_FAILURE',
  THIRD_PARTY_FAILURE: 'THIRD_PARTY_FAILURE',
  DATA_SYNC_FAILURE: 'DATA_SYNC_FAILURE',
  PERMISSION_FAILURE: 'PERMISSION_FAILURE',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_INTERNAL_ERROR: 'UNKNOWN_INTERNAL_ERROR'
};

// ─── ERROR SEVERITY LEVELS ────────────────────────────────────────────────────
const SEVERITIES = {
  INFO: 'info',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// ─── SENSITIVE PATTERNS TO REDACT ─────────────────────────────────────────────
const SECRET_FIELD_REGEX = /(password|token|secret|refresh_token|access_token|fcm_token|client_secret|jwt_secret|private_key|auth_code|authorization|cookie)/i;
const SENSITIVE_VALUE_REGEXES = [
  /GOCSPX-[a-zA-Z0-9_\-]{20,}/g, // Google Client Secret
  /ya29\.[a-zA-Z0-9_\-]{50,}/g,   // Google OAuth Access Token
  /1\/\/[a-zA-Z0-9_\-]{40,}/g,    // Google Refresh Token
  /eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]+/g, // JWTs
  /mongodb(?:\+srv)?:\/\/[^@]+@/g // Mongo connection credentials
];

/**
 * Strips raw secrets, tokens, credentials, and sensitive infrastructure details.
 * Safe for admin logs and admin dashboards.
 */
function redactSensitiveData(data) {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') {
    let sanitized = data;
    for (const regex of SENSITIVE_VALUE_REGEXES) {
      sanitized = sanitized.replace(regex, '[REDACTED_SECRET]');
    }
    return sanitized;
  }
  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveData(item));
  }
  if (typeof data === 'object') {
    const copy = {};
    for (const [key, value] of Object.entries(data)) {
      if (SECRET_FIELD_REGEX.test(key)) {
        copy[key] = '[REDACTED]';
      } else {
        copy[key] = redactSensitiveData(value);
      }
    }
    return copy;
  }
  return data;
}

/**
 * Generate a short, safe correlation reference visible to users on request.
 * e.g. "AB72F2"
 */
function generateSafeReference() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

/**
 * Generate a full backend correlation ID.
 * e.g. "GCAL-20261011-AB72F2"
 */
function generateCorrelationId(prefix = 'ALM') {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const ref = generateSafeReference();
  return `${prefix}-${dateStr}-${ref}`;
}

/**
 * Primary Error Classifier
 * Evaluates any raw error or exception and produces two distinct representations:
 * 1. User-safe UX response (never exposes project IDs, stack traces, cloud details)
 * 2. Admin diagnostic record (structured technical diagnostics, actionable guidance)
 * 
 * @param {Error|Object|string} error Raw error object or string
 * @param {Object} [context={}] Extra context: provider, operation, userId, req, etc.
 * @returns {Object} Classified error definition
 */
function classifyError(error, context = {}) {
  const provider = context.provider || 'system';
  const operation = context.operation || 'unknown';
  const req = context.req;
  const correlationId = context.correlationId || (req && req.correlationId) || generateCorrelationId(provider.slice(0, 4).toUpperCase());
  const reference = correlationId.split('-').pop() || generateSafeReference();

  // Extract raw details safely
  const rawMessage = (error?.message || (typeof error === 'string' ? error : '') || '').trim();
  const rawResponseData = error?.response?.data;
  const rawStatus = error?.response?.status || error?.status || error?.statusCode || 500;
  const googleErrObj = rawResponseData?.error;
  const googleMsg = typeof googleErrObj === 'object' ? (googleErrObj.message || '') : (typeof googleErrObj === 'string' ? googleErrObj : '');
  const fullErrorString = `${rawMessage} ${googleMsg} ${JSON.stringify(rawResponseData || {})}`.toLowerCase();

  // Baseline structure
  const result = {
    internalCode: 'UNKNOWN_INTERNAL_ERROR',
    category: CATEGORIES.UNKNOWN_INTERNAL_ERROR,
    severity: SEVERITIES.MEDIUM,
    provider,
    operation,
    httpStatus: 500,
    userSafeCode: 'TEMPORARILY_UNAVAILABLE',
    userSafeMessage: 'Something went wrong while processing your request. Please try again in a moment.',
    adminMessage: rawMessage || 'An internal system error occurred.',
    recommendedAction: 'Inspect stack trace and server logs for root cause analysis.',
    retryable: true,
    requiresReauth: false,
    requiresAdminAction: false,
    correlationId,
    reference,
    providerErrorCode: googleErrObj?.code || error?.code || null,
    providerReason: googleErrObj?.errors?.[0]?.reason || null,
    rawStack: error?.stack || null
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 0. NETWORK OFFLINE / HOST UNREACHABLE (Evaluated first before API semantics)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (
    fullErrorString.includes('enotfound') ||
    fullErrorString.includes('econnreset') ||
    fullErrorString.includes('etimedout') ||
    error?.code === 'ENOTFOUND' ||
    error?.code === 'ECONNRESET' ||
    error?.code === 'ETIMEDOUT'
  ) {
    result.internalCode = 'NETWORK_CONNECTION_ISSUE';
    result.category = CATEGORIES.NETWORK_FAILURE;
    result.severity = SEVERITIES.LOW;
    result.httpStatus = 504;
    result.retryable = true;
    result.userSafeCode = 'CONNECTION_PAUSED';
    result.userSafeMessage = "Connection problem. We'll continue when your connection returns.";
    result.adminMessage = `Network connection timed out or host unreachable: ${rawMessage}`;
    result.recommendedAction = 'Verify outbound firewall settings and DNS resolution for external endpoints.';
    return result;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. GOOGLE CALENDAR INTEGRATION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (provider === 'google-calendar' || fullErrorString.includes('calendar') || fullErrorString.includes('googleapis')) {
    result.provider = 'google-calendar';

    // A. Google Calendar API Disabled in Google Cloud
    if (
      rawStatus === 403 &&
      (fullErrorString.includes('not been used') ||
       fullErrorString.includes('disabled') ||
       fullErrorString.includes('accessnotconfigured') ||
       fullErrorString.includes('has not been activated'))
    ) {
      result.internalCode = 'GOOGLE_CALENDAR_API_DISABLED';
      result.category = CATEGORIES.CONFIGURATION_FAILURE;
      result.severity = SEVERITIES.HIGH;
      result.httpStatus = 503;
      result.retryable = false;
      result.requiresAdminAction = true;
      result.requiresReauth = false;
      result.userSafeCode = 'CALENDAR_CONNECTION_UNAVAILABLE';
      result.userSafeMessage = 'Calendar connection is temporarily unavailable. We\'ve been notified and are working on it. Your existing calendar connection and data are safe.';
      result.adminMessage = 'Google Calendar API is not activated or disabled in the Google Cloud Project. Events cannot be fetched until activated in Google Cloud Console.';
      result.recommendedAction = 'Enable Google Calendar API in Google Cloud Console for the configured project credentials.';
      return result;
    }

    // B. OAuth Redirect URI Mismatch / Bad OAuth Client Config
    if (
      fullErrorString.includes('redirect_uri_mismatch') ||
      (rawStatus === 400 && fullErrorString.includes('redirect'))
    ) {
      result.internalCode = 'GOOGLE_OAUTH_REDIRECT_MISMATCH';
      result.category = CATEGORIES.CONFIGURATION_FAILURE;
      result.severity = SEVERITIES.HIGH;
      result.httpStatus = 503;
      result.retryable = false;
      result.requiresAdminAction = true;
      result.userSafeCode = 'CALENDAR_CONFIG_UNAVAILABLE';
      result.userSafeMessage = 'Calendar connection is temporarily unavailable. We\'ve been notified and are working on it. Please try again later.';
      result.adminMessage = 'Google OAuth Redirect URI mismatch detected. The redirect URI does not match Authorized Redirect URIs in Google Cloud Console.';
      result.recommendedAction = 'Update Authorized Redirect URIs in Google Cloud Console to match backend configuration.';
      return result;
    }

    // C. User Denied or Cancelled Authorization
    if (
      fullErrorString.includes('access_denied') ||
      fullErrorString.includes('user_denied') ||
      fullErrorString.includes('cancelled') ||
      fullErrorString.includes('declined')
    ) {
      result.internalCode = 'GOOGLE_AUTH_USER_CANCELLED';
      result.category = CATEGORIES.USER_ACTION_REQUIRED;
      result.severity = SEVERITIES.INFO;
      result.httpStatus = 200;
      result.retryable = true;
      result.requiresAdminAction = false;
      result.requiresReauth = false;
      result.userSafeCode = 'CALENDAR_CONNECTION_CANCELLED';
      result.userSafeMessage = 'No problem — your Google Calendar wasn\'t connected. You can connect it anytime from Settings.';
      result.adminMessage = 'User voluntarily cancelled or declined Google Calendar authorization consent screen.';
      result.recommendedAction = 'No administrative action needed. Standard user workflow.';
      return result;
    }

    // D. OAuth Refresh Token Expired or Revoked
    if (
      rawStatus === 401 ||
      fullErrorString.includes('invalid_grant') ||
      fullErrorString.includes('token has been expired or revoked') ||
      fullErrorString.includes('reauthorization_required')
    ) {
      result.internalCode = 'GOOGLE_AUTH_TOKEN_EXPIRED';
      result.category = CATEGORIES.AUTHORIZATION_REQUIRED;
      result.severity = SEVERITIES.MEDIUM;
      result.httpStatus = 401;
      result.retryable = false;
      result.requiresReauth = true;
      result.requiresAdminAction = false;
      result.userSafeCode = 'CALENDAR_REAUTH_REQUIRED';
      result.userSafeMessage = 'Your Google Calendar connection needs to be renewed. Reconnect your calendar to continue syncing.';
      result.adminMessage = 'Google OAuth refresh token expired, was revoked by the user in Google Security, or password was changed.';
      result.recommendedAction = 'Inform user to reconnect via Calendar Settings.';
      return result;
    }

    // E. Quota / Rate Limit Exceeded
    if (
      rawStatus === 429 ||
      fullErrorString.includes('ratelimitexceeded') ||
      fullErrorString.includes('quotaexceeded') ||
      fullErrorString.includes('resource_exhausted')
    ) {
      result.internalCode = 'GOOGLE_API_RATE_LIMITED';
      result.category = CATEGORIES.RATE_LIMITED;
      result.severity = SEVERITIES.MEDIUM;
      result.httpStatus = 429;
      result.retryable = true;
      result.userSafeCode = 'CALENDAR_SYNC_DELAYED';
      result.userSafeMessage = 'Your calendar is taking a little longer to update. We\'ll continue syncing automatically.';
      result.adminMessage = 'Google Calendar API rate limit or quota exceeded for the configured Google Cloud project.';
      result.recommendedAction = 'Implement backoff or request Google Cloud quota increase if user concurrency is high.';
      return result;
    }

    // F. Selected Calendar Not Found
    if (rawStatus === 404 || (fullErrorString.includes('not found') && !fullErrorString.includes('enotfound'))) {
      result.internalCode = 'GOOGLE_CALENDAR_NOT_FOUND';
      result.category = CATEGORIES.NOT_FOUND;
      result.severity = SEVERITIES.LOW;
      result.httpStatus = 404;
      result.retryable = false;
      result.userSafeCode = 'CALENDAR_NOT_FOUND';
      result.userSafeMessage = 'One of your selected calendars is no longer available. Please review your calendar selection in Settings.';
      result.adminMessage = `Requested Google Calendar ID (${context.calendarId || 'unknown'}) was deleted or inaccessible.`;
      result.recommendedAction = 'Prune deleted calendar ID from user selectedCalendarIds.';
      return result;
    }

    // G. Google 5xx Transient Outage
    if (rawStatus >= 500 && rawStatus <= 504) {
      result.internalCode = 'GOOGLE_API_TEMPORARY_OUTAGE';
      result.category = CATEGORIES.TEMPORARY_SERVICE_FAILURE;
      result.severity = SEVERITIES.MEDIUM;
      result.httpStatus = 503;
      result.retryable = true;
      result.userSafeCode = 'CALENDAR_TEMPORARILY_UNAVAILABLE';
      result.userSafeMessage = 'Calendar sync is temporarily unavailable. Your existing calendar data is safe. We\'ll try again automatically.';
      result.adminMessage = `Google API returned transient HTTP ${rawStatus} server error.`;
      result.recommendedAction = 'Retry with exponential backoff and jitter. Verify Google Workspace status dashboard.';
      return result;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. ACTIVITY INTELLIGENCE & EXTERNAL CODING PLATFORMS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (provider === 'activity-hub' || context.platform || fullErrorString.includes('leetcode') || fullErrorString.includes('github') || fullErrorString.includes('duolingo') || fullErrorString.includes('codeforces')) {
    result.provider = 'activity-hub';
    const platform = context.platform || 'external platform';

    if (rawStatus === 429 || fullErrorString.includes('rate limit')) {
      result.internalCode = 'ACTIVITY_PLATFORM_RATE_LIMITED';
      result.category = CATEGORIES.RATE_LIMITED;
      result.severity = SEVERITIES.LOW;
      result.httpStatus = 429;
      result.retryable = true;
      result.userSafeCode = 'ACTIVITY_SYNC_DELAYED';
      result.userSafeMessage = `Activity verification is temporarily delayed. We\'ll check again automatically.`;
      result.adminMessage = `Rate limit reached while querying ${platform} public API.`;
      result.recommendedAction = `Throttle sync rate for ${platform} or rotate API keys/tokens.`;
      return result;
    }

    result.internalCode = 'ACTIVITY_PLATFORM_UNAVAILABLE';
    result.category = CATEGORIES.THIRD_PARTY_FAILURE;
    result.severity = SEVERITIES.LOW;
    result.httpStatus = 503;
    result.retryable = true;
    result.userSafeCode = 'ACTIVITY_TEMPORARILY_DELAYED';
    result.userSafeMessage = 'Activity verification is temporarily delayed. We\'ll check again automatically.';
    result.adminMessage = `${platform} verification endpoint returned ${rawStatus}: ${rawMessage}`;
    result.recommendedAction = `Check external service uptime for ${platform}.`;
    return result;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. PUSH NOTIFICATIONS / FIREBASE FCM
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (provider === 'firebase-fcm' || provider === 'web-push' || fullErrorString.includes('messaging') || fullErrorString.includes('fcm')) {
    result.provider = 'firebase-fcm';
    result.internalCode = 'FCM_DELIVERY_FAILURE';
    result.category = CATEGORIES.THIRD_PARTY_FAILURE;
    result.severity = SEVERITIES.LOW;
    result.httpStatus = 200; // FCM delivery issues should not break user requests
    result.retryable = true;
    result.userSafeCode = 'NOTIFICATION_DELAYED';
    result.userSafeMessage = 'Notifications may be slightly delayed. We\'re delivering them as soon as possible.';
    result.adminMessage = `FCM Push delivery failed: ${rawMessage}`;
    result.recommendedAction = 'Check Firebase service account configuration, expired registration tokens, and project quota.';
    return result;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. AI ASSISTANT PROVIDERS (GROQ / GEMINI / OPENROUTER)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (provider === 'ai-service' || fullErrorString.includes('groq') || fullErrorString.includes('gemini') || fullErrorString.includes('openrouter')) {
    result.provider = 'ai-service';
    result.internalCode = 'AI_PROVIDER_UNAVAILABLE';
    result.category = CATEGORIES.THIRD_PARTY_FAILURE;
    result.severity = SEVERITIES.MEDIUM;
    result.httpStatus = 503;
    result.retryable = true;
    result.userSafeCode = 'AI_TEMPORARILY_UNAVAILABLE';
    result.userSafeMessage = 'The AI assistant is temporarily unavailable. Please try again later.';
    result.adminMessage = `AI provider (${context.aiModel || 'default'}) failed: ${rawMessage}`;
    result.recommendedAction = 'Check AI provider API key balance, rate limits, or switch to backup model.';
    return result;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. DATABASE / REDIS INFRASTRUCTURE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (fullErrorString.includes('mongoservererror') || fullErrorString.includes('mongooseerror') || fullErrorString.includes('redis') || fullErrorString.includes('econnrefused')) {
    result.provider = fullErrorString.includes('redis') ? 'redis' : 'mongodb';
    result.internalCode = fullErrorString.includes('redis') ? 'REDIS_CONNECTION_FAILURE' : 'DATABASE_TEMPORARILY_UNAVAILABLE';
    result.category = CATEGORIES.TEMPORARY_SERVICE_FAILURE;
    result.severity = SEVERITIES.CRITICAL;
    result.httpStatus = 503;
    result.retryable = true;
    result.requiresAdminAction = true;
    result.userSafeCode = 'SERVICE_TEMPORARILY_BUSY';
    result.userSafeMessage = 'Something went wrong while loading this. Your data is safe. Please try again in a moment.';
    result.adminMessage = `Database or cache operational failure: ${rawMessage}`;
    result.recommendedAction = 'Inspect database cluster health, connection pool capacity, and network access.';
    return result;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. NETWORK OFFLINE / TIMEOUT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (fullErrorString.includes('network') || fullErrorString.includes('enotfound') || fullErrorString.includes('etimedout') || fullErrorString.includes('timeout')) {
    result.internalCode = 'NETWORK_CONNECTION_ISSUE';
    result.category = CATEGORIES.NETWORK_FAILURE;
    result.severity = SEVERITIES.LOW;
    result.httpStatus = 504;
    result.retryable = true;
    result.userSafeCode = 'CONNECTION_PAUSED';
    result.userSafeMessage = 'Connection problem. We\'ll continue when your connection returns.';
    result.adminMessage = `Network connection timed out or host unreachable: ${rawMessage}`;
    result.recommendedAction = 'Verify outbound firewall settings and third-party DNS resolution.';
    return result;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. AUTHENTICATION & SESSION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (rawStatus === 401 || fullErrorString.includes('jwt') || fullErrorString.includes('token expired') || fullErrorString.includes('unauthorized')) {
    result.internalCode = 'AUTH_SESSION_EXPIRED';
    result.category = CATEGORIES.AUTHORIZATION_REQUIRED;
    result.severity = SEVERITIES.INFO;
    result.httpStatus = 401;
    result.retryable = false;
    result.requiresReauth = true;
    result.userSafeCode = 'SESSION_EXPIRED';
    result.userSafeMessage = 'Your session has expired. Please sign in again to continue.';
    result.adminMessage = 'User authentication token expired or invalid signature.';
    result.recommendedAction = 'Client must refresh token or prompt user to sign in.';
    return result;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. VALIDATION ERRORS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (rawStatus === 400 || error?.name === 'ValidationError') {
    result.internalCode = 'VALIDATION_ERROR';
    result.category = CATEGORIES.VALIDATION_ERROR;
    result.severity = SEVERITIES.INFO;
    result.httpStatus = 400;
    result.retryable = false;
    result.userSafeCode = 'INVALID_INPUT';
    result.userSafeMessage = rawMessage && !SECRET_FIELD_REGEX.test(rawMessage) && rawMessage.length < 120
      ? rawMessage
      : 'Please check the information you entered and try again.';
    result.adminMessage = `Client input validation failed: ${rawMessage}`;
    result.recommendedAction = 'Check client payload against route schema.';
    return result;
  }

  return result;
}

/**
 * Produces the clean, safe JSON schema returned to normal browser / mobile users.
 * Never includes stack traces, Google Cloud project IDs, secrets, or internal details.
 */
function toUserSafeResponse(classifiedError) {
  return {
    success: false,
    error: {
      code: classifiedError.userSafeCode,
      category: classifiedError.category.toLowerCase(),
      message: classifiedError.userSafeMessage,
      retryable: Boolean(classifiedError.retryable),
      requiresReauth: Boolean(classifiedError.requiresReauth),
      reference: classifiedError.reference
    }
  };
}

module.exports = {
  CATEGORIES,
  SEVERITIES,
  redactSensitiveData,
  generateSafeReference,
  generateCorrelationId,
  classifyError,
  toUserSafeResponse
};
