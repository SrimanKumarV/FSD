/**
 * Activity Hub API Tests
 * Tests goal CRUD, completion, preferences, dashboard, and security
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');

// Must set env before importing app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-activity-hub';

const { app } = require('../server');
const User = require('../models/User');
const ActivityGoal = require('../models/ActivityGoal');
const ActivityRecord = require('../models/ActivityRecord');
const ReminderPreference = require('../models/ReminderPreference');

let mongoServer;
let testUser;
let authToken;
let adminUser;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(mongoUri);

  // Create test user
  testUser = await User.create({
    name: 'Test Student',
    email: 'teststudent@test.com',
    password: 'password123',
    role: 'student',
    isVerified: true,
    isActive: true,
    department: 'CSE'
  });
  authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // Create admin user
  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
    isVerified: true,
    isActive: true,
    department: 'CSE'
  });
  adminToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  await ActivityGoal.deleteMany({});
  await ActivityRecord.deleteMany({});
  await ReminderPreference.deleteMany({});
});

// ─── AUTH TESTS ─────────────────────────────────────────────────

describe('Activity Hub - Authentication', () => {
  test('Unauthorized user cannot access dashboard', async () => {
    const res = await request(app).get('/api/activity/dashboard');
    expect(res.statusCode).toBe(401);
  });

  test('Unauthorized user cannot access goals', async () => {
    const res = await request(app).get('/api/activity/goals');
    expect(res.statusCode).toBe(401);
  });

  test('Unauthorized user cannot create goals', async () => {
    const res = await request(app)
      .post('/api/activity/goals')
      .send({ title: 'Test Goal' });
    expect(res.statusCode).toBe(401);
  });
});

// ─── GOAL CRUD TESTS ────────────────────────────────────────────

describe('Activity Hub - Goals', () => {
  test('Create goal successfully', async () => {
    const res = await request(app)
      .post('/api/activity/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Complete LeetCode problem',
        category: 'coding',
        platform: 'leetcode',
        frequency: 'daily',
        target: 'Easy or Medium'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Complete LeetCode problem');
    expect(res.body.category).toBe('coding');
    expect(res.body.platform).toBe('leetcode');
    expect(res.body.currentStreak).toBe(0);
  });

  test('Get all goals', async () => {
    await ActivityGoal.create({
      userId: testUser._id,
      title: 'Test Goal 1',
      category: 'coding'
    });
    await ActivityGoal.create({
      userId: testUser._id,
      title: 'Test Goal 2',
      category: 'learning'
    });

    const res = await request(app)
      .get('/api/activity/goals')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('Update goal', async () => {
    const goal = await ActivityGoal.create({
      userId: testUser._id,
      title: 'Old Title',
      category: 'coding'
    });

    const res = await request(app)
      .put(`/api/activity/goals/${goal._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'New Title', category: 'learning' });
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('New Title');
    expect(res.body.category).toBe('learning');
  });

  test('Delete goal', async () => {
    const goal = await ActivityGoal.create({
      userId: testUser._id,
      title: 'To Delete'
    });

    const res = await request(app)
      .delete(`/api/activity/goals/${goal._id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Goal deleted');

    const count = await ActivityGoal.countDocuments({ userId: testUser._id });
    expect(count).toBe(0);
  });

  test('Cannot delete another user\'s goal', async () => {
    const otherUser = await User.create({
      name: 'Other User',
      email: 'other@test.com',
      password: 'password123',
      role: 'student',
      department: 'ECE'
    });
    const goal = await ActivityGoal.create({
      userId: otherUser._id,
      title: 'Other Goal'
    });

    const res = await request(app)
      .delete(`/api/activity/goals/${goal._id}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(404);
  });

  test('Goal title validation', async () => {
    const res = await request(app)
      .post('/api/activity/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: '', category: 'coding' });
    expect(res.statusCode).toBe(400);
  });

  test('Goal limit (max 20)', async () => {
    // Create 20 goals
    for (let i = 0; i < 20; i++) {
      await ActivityGoal.create({
        userId: testUser._id,
        title: `Goal ${i + 1}`
      });
    }

    const res = await request(app)
      .post('/api/activity/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Goal 21' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('Maximum 20');
  });
});

// ─── GOAL COMPLETION TESTS ──────────────────────────────────────

describe('Activity Hub - Goal Completion', () => {
  test('Complete goal for today', async () => {
    const goal = await ActivityGoal.create({
      userId: testUser._id,
      title: 'Complete LeetCode'
    });

    const res = await request(app)
      .post(`/api/activity/goals/${goal._id}/complete`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Goal completed!');
    expect(res.body.goal.currentStreak).toBe(1);
    expect(res.body.goal.totalCompletions).toBe(1);
  });

  test('Cannot complete same goal twice on same day', async () => {
    const goal = await ActivityGoal.create({
      userId: testUser._id,
      title: 'Complete LeetCode'
    });

    await request(app)
      .post(`/api/activity/goals/${goal._id}/complete`)
      .set('Authorization', `Bearer ${authToken}`);

    const res = await request(app)
      .post(`/api/activity/goals/${goal._id}/complete`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.body.alreadyCompleted).toBe(true);
  });

  test('Enable/disable goal', async () => {
    const goal = await ActivityGoal.create({
      userId: testUser._id,
      title: 'Toggle Goal',
      enabled: true
    });

    const res = await request(app)
      .put(`/api/activity/goals/${goal._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ enabled: false });
    expect(res.statusCode).toBe(200);
    expect(res.body.enabled).toBe(false);
  });
});

// ─── PREFERENCES TESTS ─────────────────────────────────────────

describe('Activity Hub - Preferences', () => {
  test('Get default preferences', async () => {
    const res = await request(app)
      .get('/api/activity/preferences')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.emailEnabled).toBe(true);
    expect(res.body.dailyReminder).toBe(true);
    expect(res.body.timezone).toBe('Asia/Kolkata');
  });

  test('Update preferences', async () => {
    // First create defaults
    await request(app)
      .get('/api/activity/preferences')
      .set('Authorization', `Bearer ${authToken}`);

    const res = await request(app)
      .put('/api/activity/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        emailEnabled: false,
        reminderTime: '08:00',
        timezone: 'America/New_York',
        quietHoursEnabled: true,
        quietHoursStart: '23:00',
        quietHoursEnd: '06:00'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.emailEnabled).toBe(false);
    expect(res.body.reminderTime).toBe('08:00');
    expect(res.body.timezone).toBe('America/New_York');
  });

  test('Invalid reminder time format rejected', async () => {
    const res = await request(app)
      .put('/api/activity/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reminderTime: 'invalid' });
    expect(res.statusCode).toBe(400);
  });
});

// ─── DASHBOARD TESTS ────────────────────────────────────────────

describe('Activity Hub - Dashboard', () => {
  test('Get dashboard with no goals', async () => {
    const res = await request(app)
      .get('/api/activity/dashboard')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.todaysGoals.total).toBe(0);
    expect(res.body.currentStreak).toBe(0);
  });

  test('Get dashboard with goals', async () => {
    await ActivityGoal.create({
      userId: testUser._id,
      title: 'Goal 1',
      category: 'coding',
      enabled: true
    });

    const res = await request(app)
      .get('/api/activity/dashboard')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.todaysGoals.total).toBe(1);
  });
});

// ─── PRIVACY TESTS ──────────────────────────────────────────────

describe('Activity Hub - Privacy', () => {
  test('Delete all activity data', async () => {
    await ActivityGoal.create({ userId: testUser._id, title: 'Goal 1' });
    await ActivityRecord.create({
      userId: testUser._id,
      date: '2024-01-01',
      completed: true
    });
    await ReminderPreference.create({ userId: testUser._id });

    const res = await request(app)
      .delete('/api/activity/data')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);

    const goals = await ActivityGoal.countDocuments({ userId: testUser._id });
    const records = await ActivityRecord.countDocuments({ userId: testUser._id });
    const prefs = await ReminderPreference.countDocuments({ userId: testUser._id });
    expect(goals).toBe(0);
    expect(records).toBe(0);
    expect(prefs).toBe(0);
  });
});

// ─── ADMIN TESTS ────────────────────────────────────────────────

describe('Activity Hub - Admin', () => {
  test('Admin can access analytics', async () => {
    const res = await request(app)
      .get('/api/activity/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('totalGoals');
    expect(res.body).toHaveProperty('usersWithGoals');
  });

  test('Non-admin cannot access analytics', async () => {
    const res = await request(app)
      .get('/api/activity/admin/analytics')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(403);
  });
});
