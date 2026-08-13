const request = require('supertest');
const { app, server } = require('../server'); // ensure we don't start the server
const { connect, closeDatabase, clearDatabase } = require('./setup');
const mongoose = require('mongoose');

beforeAll(async () => {
  // Ensure we connect to the memory server, not the real DB
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('Root API Verification', () => {
  it('should return 200 OK from the root route', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Alumni Portal Server is up and running!');
  });
});

describe('Auth API (Example)', () => {
  it('should reject registration with missing data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        // missing required fields
        email: 'test@example.com'
      });
    
    // Usually expects 400 Bad Request
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
  });
});
