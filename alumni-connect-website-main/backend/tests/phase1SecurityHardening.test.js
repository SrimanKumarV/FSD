const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const User = require('../models/User');
const { encrypt, decrypt, parseKey } = require('../utils/encryption');
const webPushService = require('../services/webPushService');

jest.mock('../models/User');
jest.mock('../utils/sendEmail', () => jest.fn().mockResolvedValue(true));
jest.mock('../utils/sendSMS', () => jest.fn().mockResolvedValue(true));

describe('Phase 1 — Security Hardening Regression Suite', () => {
  const TEST_JWT_SECRET = 'test_super_secure_jwt_secret_with_32_characters_minimum!';
  const TEST_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 hex chars = 32 bytes

  beforeAll(() => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. Google OAuth Token Cryptographic Verification & Rejection
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Google OAuth Hardening', () => {
    it('MUST reject forged Google ID tokens that fail cryptographic signature verification', async () => {
      // Craft an unverified token signed by an arbitrary key
      const forgedToken = jwt.sign(
        { email: 'admin@alumnex.com', iss: 'https://accounts.google.com', aud: 'test-client-id.apps.googleusercontent.com' },
        'attacker_malicious_private_key'
      );

      // Mock googleClient to fail signature verification as Google's real servers would
      const mockVerifyIdToken = jest.fn().mockRejectedValue(new Error('Invalid token signature'));
      authService.getGoogleClient = jest.fn().mockReturnValue({ verifyIdToken: mockVerifyIdToken });

      await expect(authService.processGoogleLogin(forgedToken)).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Invalid or forged Google authentication token/i)
      });
    });

    it('MUST reject Google tokens with invalid audience (client ID mismatch)', async () => {
      const wrongAudienceToken = jwt.sign(
        { email: 'victim@gmail.com', iss: 'https://accounts.google.com', aud: 'different-app.apps.googleusercontent.com' },
        'some_key'
      );

      const mockVerifyIdToken = jest.fn().mockRejectedValue(new Error('Wrong recipient, payload audience != requiredAudience'));
      authService.getGoogleClient = jest.fn().mockReturnValue({ verifyIdToken: mockVerifyIdToken });

      await expect(authService.processGoogleLogin(wrongAudienceToken)).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Invalid or forged Google authentication token/i)
      });
    });

    it('MUST reject expired Google ID tokens', async () => {
      const expiredToken = jwt.sign(
        { email: 'user@gmail.com', iss: 'https://accounts.google.com', aud: process.env.GOOGLE_CLIENT_ID, exp: Math.floor(Date.now() / 1000) - 3600 },
        'some_key'
      );

      const mockVerifyIdToken = jest.fn().mockRejectedValue(new Error('Token used too late, exp is in the past'));
      authService.getGoogleClient = jest.fn().mockReturnValue({ verifyIdToken: mockVerifyIdToken });

      await expect(authService.processGoogleLogin(expiredToken)).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Invalid or forged Google authentication token/i)
      });
    });

    it('MUST accept legitimately verified Google tokens and link account', async () => {
      const validPayload = {
        email: 'legit@gmail.com',
        name: 'Legit User',
        picture: 'https://lh3.googleusercontent.com/photo.jpg',
        sub: 'google_sub_99999',
        iss: 'https://accounts.google.com',
        aud: process.env.GOOGLE_CLIENT_ID,
        email_verified: true
      };

      const mockVerifyIdToken = jest.fn().mockResolvedValue({
        getPayload: () => validPayload
      });
      authService.getGoogleClient = jest.fn().mockReturnValue({ verifyIdToken: mockVerifyIdToken });

      const mockUser = {
        _id: 'user_legit_id',
        email: 'legit@gmail.com',
        name: 'Legit User',
        isVerified: true,
        save: jest.fn().mockResolvedValue(true),
        getPublicProfile: jest.fn().mockReturnValue({ _id: 'user_legit_id', email: 'legit@gmail.com' })
      };
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.processGoogleLogin('valid.jwt.idtoken');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('legit@gmail.com');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. 2FA Pre-Authentication Challenge & OTP Brute-Force Limits
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('2FA & OTP Security Hardening', () => {
    it('MUST require a signed pre-auth challenge for verify2FA', async () => {
      await expect(authService.verify2FA('target@alumnex.com', '123456', null)).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/pre-authentication challenge is required/i)
      });
    });

    it('MUST reject 2FA verification if pre-auth challenge signature is forged or invalid', async () => {
      const forgedChallenge = jwt.sign(
        { email: 'target@alumnex.com', type: '2fa_pre_auth' },
        'attacker_wrong_secret'
      );

      await expect(authService.verify2FA('target@alumnex.com', '123456', forgedChallenge)).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Invalid or expired 2FA pre-authentication challenge/i)
      });
    });

    it('MUST reject 2FA verification if pre-auth challenge email does not match target email', async () => {
      const mismatchedChallenge = jwt.sign(
        { email: 'different@alumnex.com', type: '2fa_pre_auth' },
        process.env.JWT_SECRET
      );

      await expect(authService.verify2FA('target@alumnex.com', '123456', mismatchedChallenge)).rejects.toMatchObject({
        status: 401,
        message: expect.stringMatching(/Invalid or expired 2FA pre-authentication challenge/i)
      });
    });

    it('MUST track failed OTP attempts and invalidate the OTP after 5 failed attempts (Brute Force Protection)', async () => {
      const validChallenge = jwt.sign(
        { email: 'victim@alumnex.com', type: '2fa_pre_auth' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );

      const mockUser = {
        _id: 'victim_id',
        email: 'victim@alumnex.com',
        twoFactorOtp: '654321',
        twoFactorOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
        twoFactorOtpAttempts: 4, // 5th attempt is this one
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      // 5th failed attempt triggers lockout / invalidation
      await expect(authService.verify2FA('victim@alumnex.com', '000000', validChallenge)).rejects.toMatchObject({
        status: 400
      });

      expect(mockUser.twoFactorOtpAttempts).toBe(5);

      // Subsequent attempt must be blocked as invalidated
      await expect(authService.verify2FA('victim@alumnex.com', '654321', validChallenge)).rejects.toMatchObject({
        status: 400,
        message: expect.stringMatching(/Maximum failed verification attempts exceeded/i)
      });
      expect(mockUser.twoFactorOtp).toBeUndefined();
    });

    it('MUST consume OTP on successful verification to prevent replay attacks', async () => {
      const validChallenge = jwt.sign(
        { email: 'user@alumnex.com', type: '2fa_pre_auth' },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      );

      const mockUser = {
        _id: 'user_2fa_id',
        email: 'user@alumnex.com',
        twoFactorOtp: '789123',
        twoFactorOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
        twoFactorOtpAttempts: 0,
        updateLastActive: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        getPublicProfile: jest.fn().mockReturnValue({ _id: 'user_2fa_id', email: 'user@alumnex.com' })
      };

      User.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });

      // First verification: success
      const result = await authService.verify2FA('user@alumnex.com', '789123', validChallenge);
      expect(result).toHaveProperty('token');
      expect(mockUser.twoFactorOtp).toBeUndefined(); // One-time consumption verified!
      expect(mockUser.twoFactorOtpExpires).toBeUndefined();

      // Second verification (replay attempt): must fail because OTP was cleared
      await expect(authService.verify2FA('user@alumnex.com', '789123', validChallenge)).rejects.toMatchObject({
        status: 400,
        message: expect.stringMatching(/Invalid or expired OTP/i)
      });
    });

    it('login() with 2FA enabled MUST issue preAuthChallenge instead of final session token', async () => {
      const mock2FAUser = {
        _id: 'user_with_2fa',
        email: 'secure@alumnex.com',
        twoFactorEnabled: true,
        isVerified: true,
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue(mock2FAUser) });

      const loginResult = await authService.login('secure@alumnex.com', 'CorrectPassword123!');
      expect(loginResult.requires2FA).toBe(true);
      expect(loginResult).toHaveProperty('preAuthChallenge');
      expect(loginResult).not.toHaveProperty('token'); // Final session token is NOT leaked!

      // Verify structure of the issued challenge
      const decodedChallenge = jwt.verify(loginResult.preAuthChallenge, process.env.JWT_SECRET);
      expect(decodedChallenge.email).toBe('secure@alumnex.com');
      expect(decodedChallenge.type).toBe('2fa_pre_auth');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. Dedicated Encryption & Legacy Compatibility Hardening
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Encryption Utility Hardening', () => {
    it('MUST encrypt and decrypt correctly with the dedicated 32-byte ENCRYPTION_KEY', () => {
      const plaintext = 'Sensitive Calendar OAuth Refresh Token 12345';
      const ciphertext = encrypt(plaintext);

      expect(ciphertext).not.toBe(plaintext);
      expect(ciphertext.split(':')).toHaveLength(3); // iv:authTag:cipher

      const decrypted = decrypt(ciphertext);
      expect(decrypted).toBe(plaintext);
    });

    it('MUST preserve backwards-compatibility: decrypt records encrypted with legacy key', () => {
      const crypto = require('crypto');
      const legacySecret = 'legacy_jwt_secret_used_for_historical_encryption';
      process.env.JWT_SECRET = legacySecret;

      // Encrypt something directly with legacy derived key
      const legacyKey = crypto.createHash('sha256').update(legacySecret).digest();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', legacyKey, iv);
      let enc = cipher.update('Historical Secret Data', 'utf8', 'hex');
      enc += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      const legacyCiphertext = `${iv.toString('hex')}:${authTag}:${enc}`;

      // decrypt() with dedicated key active should seamlessly fall back to legacy key and decrypt
      const decrypted = decrypt(legacyCiphertext);
      expect(decrypted).toBe('Historical Secret Data');
    });

    it('MUST validate key lengths and formats accurately', () => {
      expect(parseKey('short')).toBeNull();
      expect(parseKey('')).toBeNull();
      // Valid 64 hex char key:
      const hexKey = parseKey('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
      expect(hexKey).toBeInstanceOf(Buffer);
      expect(hexKey.length).toBe(32);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. WebPush Service Secret & Availability Hardening
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('WebPush Service Hardening', () => {
    it('MUST NOT contain hardcoded VAPID credentials in source code', () => {
      const fs = require('fs');
      const src = fs.readFileSync(require.resolve('../services/webPushService'), 'utf8');

      expect(src).not.toContain('DEFAULT_VAPID_PUBLIC');
      expect(src).not.toContain('DEFAULT_VAPID_PRIVATE');
      expect(src).not.toContain('A25DaMua84sNKE29lJAoqk2hlVuaaGyY48vl7R4fp9s'); // Old leaked private key
    });

    it('MUST gracefully report disabled status when VAPID is unconfigured without crashing', async () => {
      const previousPublic = process.env.VAPID_PUBLIC_KEY;
      const previousPrivate = process.env.VAPID_PRIVATE_KEY;
      delete process.env.VAPID_PUBLIC_KEY;
      delete process.env.VAPID_PRIVATE_KEY;

      const pushInstance = new (webPushService.constructor)();
      expect(pushInstance.isConfigured()).toBe(false);
      expect(pushInstance.getPublicKey()).toBeNull();

      const result = await pushInstance.sendPushNotification(
        { endpoint: 'https://fcm.googleapis.com/fcm/send/fake' },
        { title: 'Test' }
      );
      expect(result.disabled).toBe(true);
      expect(result.success).toBe(false);

      // Restore
      if (previousPublic) process.env.VAPID_PUBLIC_KEY = previousPublic;
      if (previousPrivate) process.env.VAPID_PRIVATE_KEY = previousPrivate;
    });
  });
});
