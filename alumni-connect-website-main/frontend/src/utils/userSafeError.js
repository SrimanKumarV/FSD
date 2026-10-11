/**
 * Alumnex Connect — Central Frontend User-Safe Error Mapper
 * 
 * CORE UX PHILOSOPHY:
 * 1. Acknowledge + Reassure + Explain simply + Give next step.
 * 2. Never expose raw backend exceptions, stack traces, AxiosError,
 *    Google Cloud project IDs, MongoDB/Redis errors, or OAuth internals.
 * 3. Never blame the user for system/provider failures.
 * 4. Technical observability belongs in the Admin Panel; users receive calm UX.
 */

// Patterns that MUST NOT leak to normal users
const LEAKED_TECHNICAL_PATTERNS = [
  /\b\d{10,14}\b/g,
  /project\s+\d+/gi,
  /axioserror/gi,
  /network\s+error/gi,
  /typeerror/gi,
  /cannot\s+read\s+properties/gi,
  /is\s+not\s+a\s+function/gi,
  /mongoservererror/gi,
  /mongooseerror/gi,
  /econnreset/gi,
  /etimedout/gi,
  /enotfound/gi,
  /google\s+cloud\s+console/gi,
  /redirect_uri_mismatch/gi,
  /invalid_client/gi,
  /accessnotconfigured/gi,
  /onrender\.com/gi,
  /localhost:\d+/gi,
  /gocspx-/gi,
  /ya29\./gi,
  /jwt\s+expired/gi
];

/**
 * Checks whether a text string contains raw infrastructure or technical leakage
 */
export function containsTechnicalLeak(text) {
  if (!text || typeof text !== 'string') return false;
  return LEAKED_TECHNICAL_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Extracts and maps any error into a calibrated, calm, user-safe error object.
 * 
 * @param {Error|Object|string} error The raw error caught in catch blocks or queries
 * @param {string} [context=''] Context string (e.g. 'calendar', 'activity', 'auth', 'chat')
 * @returns {{
 *   message: string,
 *   code: string,
 *   category: 'temporary'|'authorization'|'network'|'user_action'|'system',
 *   retryable: boolean,
 *   requiresReauth: boolean,
 *   reference: string|null
 * }}
 */
export function getUserSafeError(error, context = '') {
  // 1. Check if backend already sent our standardized safe error contract
  const backendError = error?.response?.data?.error;
  if (backendError && typeof backendError === 'object' && backendError.message) {
    // Confirm the message doesn't contain legacy leakage
    if (!containsTechnicalLeak(backendError.message)) {
      return {
        message: backendError.message,
        code: backendError.code || 'APP_ERROR',
        category: backendError.category || 'temporary',
        retryable: Boolean(backendError.retryable),
        requiresReauth: Boolean(backendError.requiresReauth),
        reference: backendError.reference || null
      };
    }
  }

  // 2. Check for offline / network disconnection
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      message: "You're offline. We'll continue when your connection returns.",
      code: 'NETWORK_OFFLINE',
      category: 'network',
      retryable: true,
      requiresReauth: false,
      reference: null
    };
  }

  // Extract raw strings for classification
  const rawMsg = String(
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    (typeof error === 'string' ? error : '') ||
    ''
  ).trim();

  const status = error?.response?.status;
  const lowerMsg = rawMsg.toLowerCase();
  const lowerContext = context.toLowerCase();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // GOOGLE CALENDAR CONTEXT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (lowerContext.includes('calendar') || lowerMsg.includes('calendar')) {
    // API disabled or Google Cloud configuration problem
    if (
      status === 403 ||
      status === 503 ||
      lowerMsg.includes('disabled') ||
      lowerMsg.includes('not been used') ||
      lowerMsg.includes('activated') ||
      lowerMsg.includes('redirect_uri_mismatch') ||
      lowerMsg.includes('invalid_client')
    ) {
      return {
        message: "Calendar connection is temporarily unavailable. We've been notified and are working on it. Your existing calendar connection and data are safe.",
        code: 'CALENDAR_CONNECTION_UNAVAILABLE',
        category: 'temporary',
        retryable: false,
        requiresReauth: false,
        reference: null
      };
    }

    // User cancelled OAuth permission
    if (
      lowerMsg.includes('cancelled') ||
      lowerMsg.includes('declined') ||
      lowerMsg.includes('user_denied') ||
      lowerMsg.includes('access_denied')
    ) {
      return {
        message: "No problem — your Google Calendar wasn't connected. You can connect it anytime from Settings.",
        code: 'CALENDAR_CONNECTION_CANCELLED',
        category: 'user_action',
        retryable: true,
        requiresReauth: false,
        reference: null
      };
    }

    // Refresh token expired or authorization revoked
    if (
      status === 401 ||
      lowerMsg.includes('reauth') ||
      lowerMsg.includes('expired') ||
      lowerMsg.includes('invalid_grant')
    ) {
      return {
        message: 'Your Google Calendar connection needs to be renewed. Reconnect your calendar to continue syncing.',
        code: 'CALENDAR_REAUTH_REQUIRED',
        category: 'authorization',
        retryable: false,
        requiresReauth: true,
        reference: null
      };
    }

    // Rate limited
    if (status === 429 || lowerMsg.includes('quota') || lowerMsg.includes('rate limit')) {
      return {
        message: "Your calendar is taking a little longer to update. We'll continue syncing automatically.",
        code: 'CALENDAR_RATE_LIMITED',
        category: 'temporary',
        retryable: true,
        requiresReauth: false,
        reference: null
      };
    }

    // Default calendar temporary issue
    return {
      message: "Calendar sync is temporarily unavailable. Your existing calendar data is safe. We'll try again automatically.",
      code: 'CALENDAR_TEMPORARILY_UNAVAILABLE',
      category: 'temporary',
      retryable: true,
      requiresReauth: false,
      reference: null
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ACTIVITY HUB CONTEXT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (lowerContext.includes('activity') || lowerMsg.includes('activity') || lowerMsg.includes('github') || lowerMsg.includes('leetcode')) {
    return {
      message: "Activity verification is temporarily delayed. We'll check again automatically.",
      code: 'ACTIVITY_VERIFICATION_DELAYED',
      category: 'temporary',
      retryable: true,
      requiresReauth: false,
      reference: null
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AUTHENTICATION & SESSION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (status === 401 || lowerMsg.includes('unauthorized') || lowerMsg.includes('jwt')) {
    return {
      message: 'Your session has expired. Please sign in again to continue.',
      code: 'SESSION_EXPIRED',
      category: 'authorization',
      retryable: false,
      requiresReauth: true,
      reference: null
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // NETWORK & SERVER UNREACHABLE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (
    lowerMsg.includes('network error') ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('failed to fetch') ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return {
      message: "We couldn't connect to the server right now. Your data is safe. We'll keep trying.",
      code: 'SERVER_UNREACHABLE',
      category: 'network',
      retryable: true,
      requiresReauth: false,
      reference: null
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VALIDATION & USER ACTION
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (status === 400 && rawMsg && !containsTechnicalLeak(rawMsg) && rawMsg.length < 120) {
    return {
      message: rawMsg,
      code: 'INVALID_INPUT',
      category: 'user_action',
      retryable: false,
      requiresReauth: false,
      reference: null
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CALM FALLBACK FOR ALL OTHER UNKNOWN FAILURES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return {
    message: "Something didn't load correctly. Your data is safe. Please try again in a moment.",
    code: 'TEMPORARILY_UNAVAILABLE',
    category: 'system',
    retryable: true,
    requiresReauth: false,
    reference: null
  };
}

/**
 * Convenient string-only helper for toast.error(getUserSafeErrorMessage(error))
 */
export function getUserSafeErrorMessage(error, defaultMessage = "Something didn't load correctly. Please try again.") {
  if (!error && defaultMessage) return defaultMessage;
  const safe = getUserSafeError(error);
  return safe.message || defaultMessage;
}

export default getUserSafeError;
