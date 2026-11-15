const fcmService = require('../services/fcmService');
const firebaseAdmin = require('../services/firebaseAdmin');

describe('Android FCM Push Notification Production Pipeline', () => {
  describe('FCM Token Validation', () => {
    test('rejects missing or empty token', () => {
      expect(fcmService.validateToken(null).valid).toBe(false);
      expect(fcmService.validateToken(undefined).valid).toBe(false);
      expect(fcmService.validateToken('').valid).toBe(false);
      expect(fcmService.validateToken('   ').valid).toBe(false);
    });

    test('strictly rejects development fallback tokens (fcm_dev_*)', () => {
      const devTokenResult = fcmService.validateToken('fcm_dev_device_1234567890abcdef');
      expect(devTokenResult.valid).toBe(false);
      expect(devTokenResult.reason).toBe('fake_dev_token');
    });

    test('rejects obviously invalid short tokens', () => {
      const shortResult = fcmService.validateToken('short_token_123');
      expect(shortResult.valid).toBe(false);
      expect(shortResult.reason).toBe('token_too_short');
    });

    test('accepts realistic FCM registration tokens', () => {
      const realToken = 'test_fcm_registration_token_mock_pipeline_valid';
      const result = fcmService.validateToken(realToken);
      expect(result.valid).toBe(true);
      expect(result.token).toBe(realToken);
    });
  });

  describe('FCM Data Payload Sanitization', () => {
    test('converts non-string values into strings', () => {
      const raw = {
        numberVal: 42,
        boolVal: true,
        objVal: { key: 'value' },
        strVal: 'already_string',
        nullVal: null,
        undefVal: undefined
      };

      const sanitized = fcmService.sanitizeData(raw);

      expect(typeof sanitized.numberVal).toBe('string');
      expect(sanitized.numberVal).toBe('42');
      expect(typeof sanitized.boolVal).toBe('string');
      expect(sanitized.boolVal).toBe('true');
      expect(typeof sanitized.objVal).toBe('string');
      expect(JSON.parse(sanitized.objVal)).toEqual({ key: 'value' });
      expect(sanitized.strVal).toBe('already_string');
      expect(sanitized.nullVal).toBeUndefined();
      expect(sanitized.undefVal).toBeUndefined();
    });
  });

  describe('Token Masking for Safe Structured Logging', () => {
    test('masks tokens without exposing full secret', () => {
      const token = 'sample_fcm_token_for_mask_test';
      const masked = fcmService.maskToken(token);
      expect(masked).toBe('sample...k_test');
      expect(masked).not.toBe(token);
    });

    test('safely handles null/undefined token', () => {
      expect(fcmService.maskToken(null)).toBe('none');
      expect(fcmService.maskToken(undefined)).toBe('none');
    });
  });

  describe('Error Classification & Permanent Invalidation', () => {
    test('classifies NotRegistered and invalid-token as permanent unregistration', () => {
      const err = new Error('Requested entity was not found.');
      err.code = 'messaging/registration-token-not-registered';

      const analysis = fcmService.analyzeError(err);
      expect(analysis.isUnregistered).toBe(true);
      expect(analysis.isTransient).toBe(false);
    });

    test('classifies credential mismatch correctly without marking token as unregistered', () => {
      const err = new Error('SenderId mismatch between token and server credentials.');
      err.code = 'messaging/mismatched-credential';

      const analysis = fcmService.analyzeError(err);
      expect(analysis.isCredentialMismatch).toBe(true);
      expect(analysis.isUnregistered).toBe(false);
    });

    test('classifies transient network / timeout errors as transient', () => {
      const err = new Error('ETIMEDOUT connection failed');
      err.code = 'messaging/server-unavailable';

      const analysis = fcmService.analyzeError(err);
      expect(analysis.isTransient).toBe(true);
      expect(analysis.isUnregistered).toBe(false);
    });
  });

  describe('Firebase Admin Diagnostics', () => {
    test('returns safe diagnostics without exposing private keys', () => {
      const diag = firebaseAdmin.getDiagnosticInfo();
      expect(diag.provider).toBe('firebase-admin');
      expect(diag.androidPackage).toBe('com.alumnex.connect');
      expect(diag.privateKey).toBeUndefined();
      expect(diag.clientSecret).toBeUndefined();
      expect(diag.serviceAccount).toBeUndefined();
    });
  });
});
