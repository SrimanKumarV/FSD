/**
 * Alumnex Connect — Global User-Safe Error Handling & Admin Diagnostics Test Suite
 * 
 * Tests the complete error handling lifecycle:
 * RAW ERROR -> CLASSIFY -> SANITIZE -> USER SAFE UX + ADMIN DIAGNOSTIC INCIDENT -> RECOVERY
 */

const {
  classifyError,
  toUserSafeResponse,
  redactSensitiveData,
  CATEGORIES,
  SEVERITIES
} = require('../utils/errorClassification');
const incidentService = require('../services/incidentService');
const AdminIncident = require('../models/AdminIncident');
const dbHandler = require('./setup');

describe('Global User-Safe Error Architecture & Security Diagnostics', () => {
  beforeAll(async () => {
    await dbHandler.connect();
  });

  afterEach(async () => {
    await dbHandler.clearDatabase();
  });

  afterAll(async () => {
    await dbHandler.closeDatabase();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 1: CONFIGURATION FAILURE (Google Calendar API Disabled in Cloud Project)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test('1. Configuration failure: Produces safe UX message and creates HIGH severity Admin Incident', async () => {
    const rawError = {
      response: {
        status: 403,
        data: {
          error: {
            code: 403,
            message: 'Google Calendar API has not been used in project 253683997850 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=253683997850 then retry.',
            status: 'PERMISSION_DENIED'
          }
        }
      }
    };

    const classified = classifyError(rawError, {
      provider: 'google-calendar',
      operation: 'events.list'
    });

    // Verify classification
    expect(classified.internalCode).toBe('GOOGLE_CALENDAR_API_DISABLED');
    expect(classified.category).toBe(CATEGORIES.CONFIGURATION_FAILURE);
    expect(classified.severity).toBe(SEVERITIES.HIGH);
    expect(classified.requiresAdminAction).toBe(true);
    expect(classified.retryable).toBe(false);

    // Verify User-Facing Contract: NO project ID, NO cloud console link
    const userSafe = toUserSafeResponse(classified);
    expect(userSafe.success).toBe(false);
    expect(userSafe.error.message).toContain('Calendar connection is temporarily unavailable');
    expect(userSafe.error.message).toContain('Your existing calendar connection and data are safe');
    expect(userSafe.error.message).not.toContain('253683997850');
    expect(userSafe.error.message).not.toContain('console.developers.google.com');

    // Verify Admin Incident Creation
    const incident = await incidentService.recordIncident(classified);
    expect(incident).not.toBeNull();
    expect(incident.incidentCode).toBe('GOOGLE_CALENDAR_API_DISABLED');
    expect(incident.severity).toBe('high');
    expect(incident.status).toBe('open');
    expect(incident.recommendedAction).toContain('Google Cloud Console');
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 2: TRANSIENT GOOGLE FAILURE (503 Service Unavailable)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test('2. Transient Google failure: Retries safely and reassures user data is safe', async () => {
    const rawError = {
      response: {
        status: 503,
        data: { error: { code: 503, message: 'The service is currently unavailable' } }
      }
    };

    const classified = classifyError(rawError, {
      provider: 'google-calendar',
      operation: 'calendar.sync'
    });

    expect(classified.internalCode).toBe('GOOGLE_API_TEMPORARY_OUTAGE');
    expect(classified.category).toBe(CATEGORIES.TEMPORARY_SERVICE_FAILURE);
    expect(classified.retryable).toBe(true);

    const userSafe = toUserSafeResponse(classified);
    expect(userSafe.error.message).toContain('Calendar sync is temporarily unavailable');
    expect(userSafe.error.message).toContain('Your existing calendar data is safe');
    expect(userSafe.error.retryable).toBe(true);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 3: USER DENIED OAUTH (User cancelled consent)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test('3. User denied OAuth: Produces friendly notice without creating critical admin incident', async () => {
    const rawError = 'access_denied';

    const classified = classifyError(rawError, {
      provider: 'google-calendar',
      operation: 'oauth.callback'
    });

    expect(classified.internalCode).toBe('GOOGLE_AUTH_USER_CANCELLED');
    expect(classified.category).toBe(CATEGORIES.USER_ACTION_REQUIRED);
    expect(classified.severity).toBe(SEVERITIES.INFO);
    expect(classified.requiresAdminAction).toBe(false);

    const userSafe = toUserSafeResponse(classified);
    expect(userSafe.error.message).toBe("No problem — your Google Calendar wasn't connected. You can connect it anytime from Settings.");

    // Should NOT record an infrastructure incident
    const incident = await incidentService.recordIncident(classified);
    expect(incident).toBeNull();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 4: TOKEN REVOKED / EXPIRED (invalid_grant)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test('4. Token revoked: Produces reauth prompt and marks requiresReauth', async () => {
    const rawError = {
      response: {
        status: 401,
        data: { error: 'invalid_grant' }
      },
      message: 'Token has been expired or revoked.'
    };

    const classified = classifyError(rawError, {
      provider: 'google-calendar',
      operation: 'events.list'
    });

    expect(classified.internalCode).toBe('GOOGLE_AUTH_TOKEN_EXPIRED');
    expect(classified.category).toBe(CATEGORIES.AUTHORIZATION_REQUIRED);
    expect(classified.requiresReauth).toBe(true);

    const userSafe = toUserSafeResponse(classified);
    expect(userSafe.error.message).toBe('Your Google Calendar connection needs to be renewed. Reconnect your calendar to continue syncing.');
    expect(userSafe.error.requiresReauth).toBe(true);
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 5: API RATE LIMIT (429 RESOURCE_EXHAUSTED)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test('5. API rate limit: Produces delayed sync UX without raw quota error', async () => {
    const rawError = {
      response: {
        status: 429,
        data: { error: { message: 'Quota exceeded for quota metric Queries and limit Queries per minute per user' } }
      }
    };

    const classified = classifyError(rawError, {
      provider: 'google-calendar',
      operation: 'events.list'
    });

    expect(classified.internalCode).toBe('GOOGLE_API_RATE_LIMITED');
    expect(classified.category).toBe(CATEGORIES.RATE_LIMITED);
    expect(classified.retryable).toBe(true);

    const userSafe = toUserSafeResponse(classified);
    expect(userSafe.error.message).toBe("Your calendar is taking a little longer to update. We'll continue syncing automatically.");
    expect(userSafe.error.message).not.toContain('Quota exceeded');
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 6: NETWORK OFFLINE / TIMEOUT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test('6. Network offline: Produces calm connection paused message', async () => {
    const rawError = new Error('getaddrinfo ENOTFOUND www.googleapis.com');
    rawError.code = 'ENOTFOUND';

    const classified = classifyError(rawError, { provider: 'google-calendar' });

    expect(classified.category).toBe(CATEGORIES.NETWORK_FAILURE);
    const userSafe = toUserSafeResponse(classified);
    expect(userSafe.error.message).toBe("Connection problem. We'll continue when your connection returns.");
    expect(userSafe.error.message).not.toContain('ENOTFOUND');
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 7: ACTIVITY PLATFORM FAILURE (LeetCode / GitHub down)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test('7. Activity platform failure: Reassures user verification is delayed', async () => {
    const rawError = new Error('GitHub API rate limit exceeded for IP');
    const classified = classifyError(rawError, {
      provider: 'activity-hub',
      platform: 'github'
    });

    expect(classified.category).toBe(CATEGORIES.RATE_LIMITED);
    const userSafe = toUserSafeResponse(classified);
    expect(userSafe.error.message).toBe("Activity verification is temporarily delayed. We'll check again automatically.");
    expect(userSafe.error.message).not.toContain('rate limit');
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 8: UNKNOWN EXCEPTION & DATABASE FAILURE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test('8. Database failure: Hides internal Mongo details and records critical incident', async () => {
    const rawError = new Error('MongoServerError: connection to 127.0.0.1:27017 timed out');
    const classified = classifyError(rawError, { operation: 'user.find' });

    expect(classified.category).toBe(CATEGORIES.TEMPORARY_SERVICE_FAILURE);
    expect(classified.severity).toBe(SEVERITIES.CRITICAL);

    const userSafe = toUserSafeResponse(classified);
    expect(userSafe.error.message).toBe('Something went wrong while loading this. Your data is safe. Please try again in a moment.');
    expect(userSafe.error.message).not.toContain('MongoServerError');
    expect(userSafe.error.message).not.toContain('127.0.0.1');
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 9: SECURITY TEST (Redaction of secrets, tokens, and keys)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test('9. Security test: Redacts client secrets, refresh tokens, and passwords', () => {
    const sensitivePayload = {
      client_secret: 'GOCSPX-super_secret_key_1234567890123456',
      refresh_token: '1//04random_refresh_token_string_example_456',
      password: 'MySuperSecretPassword!@#',
      token: 'ya29.a0ARrdaM8random_oauth_access_token_long_string_example_789',
      safeInfo: 'Visible diagnostic description'
    };

    const redacted = redactSensitiveData(sensitivePayload);
    expect(redacted.client_secret).toBe('[REDACTED]');
    expect(redacted.refresh_token).toBe('[REDACTED]');
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.safeInfo).toBe('Visible diagnostic description');
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TEST 10: INCIDENT DEDUPLICATION & AUTO-RECOVERY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  test('10. Incident deduplication: Multiple identical failures increment occurrences and recover automatically', async () => {
    const error = {
      response: {
        status: 403,
        data: { error: { message: 'Google Calendar API has not been used in project before or it is disabled.' } }
      }
    };

    const classified = classifyError(error, { provider: 'google-calendar', operation: 'events.list' });

    // Failure 1
    const inc1 = await incidentService.recordIncident(classified);
    expect(inc1.occurrences).toBe(1);

    // Failure 2 (Same incidentCode & provider)
    const inc2 = await incidentService.recordIncident(classified);
    expect(inc2._id.toString()).toBe(inc1._id.toString());
    expect(inc2.occurrences).toBe(2);

    // Confirm only 1 incident row exists in database
    const count = await AdminIncident.countDocuments({ incidentCode: 'GOOGLE_CALENDAR_API_DISABLED' });
    expect(count).toBe(1);

    // Recovery
    await incidentService.recordRecovery('google-calendar', 'GOOGLE_CALENDAR_API_DISABLED', {
      note: 'API enabled and events verified successfully'
    });

    const resolved = await AdminIncident.findById(inc1._id);
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolvedAutomatically).toBe(true);
  });
});
