const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authRouter = require('../routes/auth');
const authService = require('../services/authService');
const axios = require('axios');

jest.mock('../services/authService');
jest.mock('axios');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Mobile Google OAuth Routes', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test_jwt_secret_key_12345',
      GOOGLE_CLIENT_ID: '253683997850-ec2t9ae74tnrsadu6enid73lnpeoho7d.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 'test_google_client_secret',
      MOBILE_GOOGLE_REDIRECT_URI: 'https://alumnex-backend-backup.onrender.com/api/auth/mobile/google/callback'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('GET /api/auth/mobile/google', () => {
    it('should redirect to Google OAuth with expected redirect_uri, client_id, and signed CSRF state', async () => {
      const res = await request(app).get('/api/auth/mobile/google');

      expect(res.statusCode).toBe(302);
      const location = res.headers.location;
      expect(location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(location).toContain('client_id=253683997850-ec2t9ae74tnrsadu6enid73lnpeoho7d.apps.googleusercontent.com');
      expect(location).toContain('redirect_uri=' + encodeURIComponent('https://alumnex-backend-backup.onrender.com/api/auth/mobile/google/callback'));
      expect(location).toContain('response_type=code');
      expect(location).toContain('state=');

      // Verify the generated state token is a valid signed JWT
      const url = new URL(location);
      const state = url.searchParams.get('state');
      const decoded = jwt.verify(state, process.env.JWT_SECRET);
      expect(decoded.type).toBe('mobile_google_oauth');
      expect(decoded).toHaveProperty('nonce');
    });

    it('should fall back to response_type=token if client secret is not configured', async () => {
      delete process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.MOBILE_GOOGLE_CLIENT_SECRET;

      const res = await request(app).get('/api/auth/mobile/google');

      expect(res.statusCode).toBe(302);
      const location = res.headers.location;
      expect(location).toContain('response_type=token');
      expect(location).toContain('redirect_uri=' + encodeURIComponent('https://alumnex-backend-backup.onrender.com/api/auth/mobile/google/callback'));
    });
  });

  describe('GET /api/auth/mobile/google/callback', () => {
    it('should return error page if user cancels OAuth (error parameter)', async () => {
      const res = await request(app)
        .get('/api/auth/mobile/google/callback')
        .query({ error: 'access_denied', error_description: 'User denied consent' });

      expect(res.statusCode).toBe(400);
      expect(res.text).toContain('com.alumnex.connect://oauth/google?error=');
      expect(res.text).toContain('Sign In Cancelled');
    });

    it('should reject callback with 403 if state is missing in code flow', async () => {
      const res = await request(app)
        .get('/api/auth/mobile/google/callback')
        .query({ code: 'test_auth_code_123' });

      expect(res.statusCode).toBe(403);
      expect(res.text).toContain('Security Verification Failed');
      expect(res.text).toContain('Missing%20OAuth%20security%20state');
    });

    it('should reject callback with 403 if state token is invalid or tampered', async () => {
      const res = await request(app)
        .get('/api/auth/mobile/google/callback')
        .query({ code: 'test_auth_code_123', state: 'invalid.tampered.jwt' });

      expect(res.statusCode).toBe(403);
      expect(res.text).toContain('Session Expired');
      expect(res.text).toContain('Expired%20or%20invalid%20OAuth%20state');
    });

    it('should exchange code, authenticate user, and redirect to deep link on valid code and state', async () => {
      const validState = jwt.sign(
        { nonce: 'abc123nonce', type: 'mobile_google_oauth' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      axios.post.mockResolvedValue({
        data: {
          access_token: 'google_access_token_123',
          id_token: 'google_id_token_123'
        }
      });

      authService.processGoogleLogin.mockResolvedValue({
        token: 'alumnex_jwt_session_token_xyz',
        user: { id: 'u1', name: 'Test User', email: 'test@gmail.com' }
      });

      const res = await request(app)
        .get('/api/auth/mobile/google/callback')
        .query({ code: 'valid_google_code', state: validState });

      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('com.alumnex.connect://oauth/google?token=alumnex_jwt_session_token_xyz');
      expect(res.text).toContain('Authentication Successful!');
      expect(authService.processGoogleLogin).toHaveBeenCalledWith('google_access_token_123');
    });

    it('should redirect to role selection deep link if new user requires role selection', async () => {
      const validState = jwt.sign(
        { nonce: 'abc123nonce', type: 'mobile_google_oauth' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      axios.post.mockResolvedValue({
        data: {
          access_token: 'google_access_token_new',
          id_token: 'google_id_token_new'
        }
      });

      authService.processGoogleLogin.mockResolvedValue({
        requiresRoleSelection: true,
        tempToken: 'temp_jwt_role_selection_token'
      });

      const res = await request(app)
        .get('/api/auth/mobile/google/callback')
        .query({ code: 'valid_code', state: validState });

      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('com.alumnex.connect://oauth/google?requiresRoleSelection=true&tempToken=temp_jwt_role_selection_token');
    });

    it('should serve client-side handoff page for implicit hash fragment when no code is in query', async () => {
      const res = await request(app).get('/api/auth/mobile/google/callback');

      expect(res.statusCode).toBe(200);
      expect(res.text).toContain('window.location.hash');
      expect(res.text).toContain('com.alumnex.connect://oauth/google?credential=');
    });
  });
});
