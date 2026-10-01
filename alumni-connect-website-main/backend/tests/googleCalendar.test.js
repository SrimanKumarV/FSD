const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { app } = require('../server');
const { connect, closeDatabase, clearDatabase } = require('./setup');
const GoogleCalendarConnection = require('../models/GoogleCalendarConnection');
const GoogleCalendarEvent = require('../models/GoogleCalendarEvent');
const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/encryption');
const googleCalendarService = require('../services/googleCalendarService');
const calendarSyncService = require('../services/calendarSyncService');

describe('Google Calendar Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await connect();
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-12345678901234567890';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
  });

  beforeEach(async () => {
    await clearDatabase();

    // Create a mock user
    testUser = await User.create({
      name: 'Calendar Test User',
      email: 'caluser@example.com',
      password: 'password123',
      role: 'student',
      isVerified: true
    });

    authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('1. Token Encryption & Decryption', () => {
    it('should encrypt and decrypt tokens correctly without loss', () => {
      const plaintext = 'ya29.a0ARrdaM-sensitive-google-refresh-token-xyz';
      const encrypted = encrypt(plaintext);

      expect(encrypted).not.toEqual(plaintext);
      expect(encrypted).toContain(':'); // iv:authTag:cipher format

      const decrypted = decrypt(encrypted);
      expect(decrypted).toEqual(plaintext);
    });

    it('should return null or safe fallback for invalid ciphertext', () => {
      expect(decrypt(null)).toBeNull();
      expect(decrypt('plain-unencrypted-text')).toEqual('plain-unencrypted-text');
    });
  });

  describe('2. GoogleCalendarConnection Model', () => {
    it('should securely encrypt accessToken and refreshToken on save and hide them by default', async () => {
      const conn = new GoogleCalendarConnection({
        userId: testUser._id,
        googleAccountEmail: 'caluser@gmail.com',
        accessToken: 'initial-access-token-123',
        refreshToken: 'initial-refresh-token-456',
        status: 'connected'
      });
      await conn.save();

      // Retrieve without +accessToken +refreshToken
      const fetched = await GoogleCalendarConnection.findOne({ userId: testUser._id });
      expect(fetched.accessToken).toBeUndefined();
      expect(fetched.refreshToken).toBeUndefined();

      // Retrieve with +accessToken +refreshToken
      const fetchedWithSecrets = await GoogleCalendarConnection.findOne({ userId: testUser._id }).select('+accessToken +refreshToken');
      expect(fetchedWithSecrets.accessToken).toContain(':'); // encrypted in DB
      expect(fetchedWithSecrets.refreshToken).toContain(':'); // encrypted in DB

      const decrypted = fetchedWithSecrets.getDecryptedTokens();
      expect(decrypted.accessToken).toBe('initial-access-token-123');
      expect(decrypted.refreshToken).toBe('initial-refresh-token-456');

      // toSafeJSON should never leak tokens
      const safe = fetched.toSafeJSON();
      expect(safe.googleAccountEmail).toBe('caluser@gmail.com');
      expect(safe.accessToken).toBeUndefined();
      expect(safe.refreshToken).toBeUndefined();
    });
  });

  describe('3. OAuth Authorization URL Generation & State Verification', () => {
    it('should generate authorization URL with signed state token and required least privilege scopes', () => {
      const { url, state } = googleCalendarService.generateAuthorizationUrl({
        userId: testUser._id,
        mode: 'web',
        redirectUri: 'http://localhost:5000/api/google-calendar/callback'
      });

      expect(url).toContain('accounts.google.com');
      expect(url).toContain('access_type=offline');
      expect(url).toContain('prompt=consent');
      expect(url).toContain('state=');
      expect(url).toContain(encodeURIComponent('https://www.googleapis.com/auth/calendar.events'));

      // Verify the state token
      const decoded = jwt.verify(state, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(testUser._id.toString());
      expect(decoded.type).toBe('google_calendar_oauth');
      expect(decoded.mode).toBe('web');
    });
  });

  describe('4. GoogleCalendarEvent Model & Idempotency', () => {
    it('should prevent duplicate events for the same user, calendar, and googleEventId', async () => {
      const now = new Date();
      const eventData = {
        userId: testUser._id,
        googleCalendarId: 'primary',
        googleEventId: 'event_unique_123',
        summary: 'Sprint Review',
        start: now,
        end: new Date(now.getTime() + 3600000),
        status: 'confirmed'
      };

      await GoogleCalendarEvent.create(eventData);

      // Attempting to insert duplicate should fail unique index constraint
      await expect(GoogleCalendarEvent.create(eventData)).rejects.toThrow();
    });
  });

  describe('5. Schedule Context & Free Time Calculation', () => {
    it('should accurately compute free time windows between scheduled events', async () => {
      const today = new Date();
      // Set to 09:00 today
      const event1Start = new Date(today);
      event1Start.setHours(10, 0, 0, 0);
      const event1End = new Date(today);
      event1End.setHours(11, 0, 0, 0);

      // Event 2: 12:00 to 13:00
      const event2Start = new Date(today);
      event2Start.setHours(12, 0, 0, 0);
      const event2End = new Date(today);
      event2End.setHours(13, 0, 0, 0);

      await GoogleCalendarEvent.create([
        {
          userId: testUser._id,
          googleCalendarId: 'primary',
          googleEventId: 'evt_1',
          summary: 'Standup',
          start: event1Start,
          end: event1End
        },
        {
          userId: testUser._id,
          googleCalendarId: 'primary',
          googleEventId: 'evt_2',
          summary: 'Client Meeting',
          start: event2Start,
          end: event2End
        }
      ]);

      const context = await calendarSyncService.getScheduleContext(testUser._id, 'UTC', today);
      expect(context.eventsCount).toBe(2);
      expect(context.events.length).toBe(2);
      expect(context.freeWindows.length).toBeGreaterThan(0);

      // Window between 11:00 and 12:00 should exist (60 mins)
      const window11to12 = context.freeWindows.find(w => w.durationMinutes === 60);
      expect(window11to12).toBeDefined();
    });
  });

  describe('6. API Endpoints', () => {
    it('GET /api/google-calendar/status should return disconnected when not connected', async () => {
      const res = await request(app)
        .get('/api/google-calendar/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.connected).toBe(false);
      expect(res.body.status).toBe('disconnected');
    });

    it('GET /api/google-calendar/connect should return authorizationUrl', async () => {
      const res = await request(app)
        .get('/api/google-calendar/connect')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.authorizationUrl).toContain('accounts.google.com');
    });

    it('GET /api/google-calendar/schedule-context should return context', async () => {
      const res = await request(app)
        .get('/api/google-calendar/schedule-context')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('events');
      expect(res.body).toHaveProperty('freeWindows');
      expect(res.body).toHaveProperty('totalFreeMinutes');
    });

    it('POST /api/google-calendar/webhook should acknowledge with 200 OK', async () => {
      const res = await request(app)
        .post('/api/google-calendar/webhook')
        .set('x-goog-channel-id', 'test-channel-1')
        .set('x-goog-resource-id', 'res-1')
        .set('x-goog-resource-state', 'sync');

      expect(res.statusCode).toBe(200);
      expect(res.text).toBe('OK');
    });
  });

  describe('7. Multi-User Database Isolation (Step 41)', () => {
    it('should strictly isolate User A and User B connections, tokens, and events', async () => {
      // Create User B
      const userB = await User.create({
        name: 'Calendar User B',
        email: 'userb@example.com',
        password: 'password123',
        role: 'student',
        isVerified: true
      });
      const authTokenB = jwt.sign({ id: userB._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Create Connection A
      await GoogleCalendarConnection.create({
        userId: testUser._id,
        googleAccountEmail: 'usera@gmail.com',
        accessToken: 'access-token-A',
        refreshToken: 'refresh-token-A',
        status: 'connected',
        primaryCalendarId: 'cal_a_primary'
      });

      // Create Connection B
      await GoogleCalendarConnection.create({
        userId: userB._id,
        googleAccountEmail: 'userb@gmail.com',
        accessToken: 'access-token-B',
        refreshToken: 'refresh-token-B',
        status: 'connected',
        primaryCalendarId: 'cal_b_primary'
      });

      // Create Event for User A
      await GoogleCalendarEvent.create({
        userId: testUser._id,
        googleCalendarId: 'cal_a_primary',
        googleEventId: 'event_A_1',
        summary: 'Secret Meeting User A',
        start: new Date(),
        end: new Date(Date.now() + 3600000),
        status: 'confirmed'
      });

      // Create Event for User B
      await GoogleCalendarEvent.create({
        userId: userB._id,
        googleCalendarId: 'cal_b_primary',
        googleEventId: 'event_B_1',
        summary: 'Secret Meeting User B',
        start: new Date(),
        end: new Date(Date.now() + 3600000),
        status: 'confirmed'
      });

      // 1. User A querying events should only see User A's events
      const resA = await request(app)
        .get('/api/google-calendar/events')
        .set('Authorization', `Bearer ${authToken}`);
      expect(resA.statusCode).toBe(200);
      expect(resA.body.events.length).toBe(1);
      expect(resA.body.events[0].summary).toBe('Secret Meeting User A');
      expect(resA.body.events[0].googleEventId).toBe('event_A_1');

      // 2. User B querying events should only see User B's events
      const resB = await request(app)
        .get('/api/google-calendar/events')
        .set('Authorization', `Bearer ${authTokenB}`);
      expect(resB.statusCode).toBe(200);
      expect(resB.body.events.length).toBe(1);
      expect(resB.body.events[0].summary).toBe('Secret Meeting User B');
      expect(resB.body.events[0].googleEventId).toBe('event_B_1');

      // 3. User A status endpoint should only see Connection A
      const statusResA = await request(app)
        .get('/api/google-calendar/status')
        .set('Authorization', `Bearer ${authToken}`);
      expect(statusResA.body.googleAccountEmail).toBe('usera@gmail.com');

      // 4. User B status endpoint should only see Connection B
      const statusResB = await request(app)
        .get('/api/google-calendar/status')
        .set('Authorization', `Bearer ${authTokenB}`);
      expect(statusResB.body.googleAccountEmail).toBe('userb@gmail.com');

      // 5. Database token isolation: User A cannot decrypt User B's tokens
      const fetchedConnA = await GoogleCalendarConnection.findOne({ userId: testUser._id }).select('+accessToken +refreshToken');
      const fetchedConnB = await GoogleCalendarConnection.findOne({ userId: userB._id }).select('+accessToken +refreshToken');
      expect(fetchedConnA.getDecryptedTokens().refreshToken).toBe('refresh-token-A');
      expect(fetchedConnB.getDecryptedTokens().refreshToken).toBe('refresh-token-B');
      expect(fetchedConnA.getDecryptedTokens().refreshToken).not.toEqual(fetchedConnB.getDecryptedTokens().refreshToken);
    });
  });
});
