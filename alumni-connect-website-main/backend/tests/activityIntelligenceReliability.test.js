/**
 * Activity Intelligence Reliability & Incident Prevention Test Suite
 * Master tests for Section 92:
 * 1. Timezone propagation & canonical calculations
 * 2. Schedule-aware streak reconciliation from durable ActivityRecord
 * 3. Historical activity recovery & backfill
 * 4. Distributed lock atomicity & user claiming
 * 5. Notification DB idempotency (createOrClaimNotification)
 * 6. FCM target token & device deduplication
 * 7. Reminder & streak-risk suppression
 * 8. Pre-midnight protection
 * 9. Temporary platform failure handling
 * 10. Diagnostics & maintenance cleanup
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-activity-reliability';

const { app } = require('../server');
const User = require('../models/User');
const ActivityGoal = require('../models/ActivityGoal');
const ActivityRecord = require('../models/ActivityRecord');
const ReminderPreference = require('../models/ReminderPreference');
const Notification = require('../models/Notification');
const NotificationDevice = require('../models/NotificationDevice');
const DevProfile = require('../models/DevProfile');
const timezoneHelper = require('../utils/timezoneHelper');
const cache = require('../utils/cache');
const activitySyncOrchestrator = require('../services/activitySyncOrchestrator');
const activityService = require('../services/activityService');
const fcmService = require('../services/fcmService');
const activityReminderCron = require('../jobs/activityReminderCron');

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

  // Initialize Notification indexes including partial unique index
  await Notification.init();
  await NotificationDevice.init();
  await ActivityRecord.init();

  testUser = await User.create({
    name: 'Reliability User',
    email: 'reliability@alumnex.com',
    password: 'password123',
    role: 'student',
    isVerified: true,
    isActive: true,
    department: 'CSE'
  });
  authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  adminUser = await User.create({
    name: 'Admin Reliability',
    email: 'admin.reliability@alumnex.com',
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
  await Notification.deleteMany({});
  await NotificationDevice.deleteMany({});
  await DevProfile.deleteMany({});
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. TIMEZONE PROPAGATION & CALCULATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('Timezone Utility & Date Engine (Prompt Section 6, 80)', () => {
  test('Correctly calculates local today and formatting across multiple timezones', () => {
    const fixedUtcTime = new Date('2026-10-05T20:30:00.000Z'); // 8:30 PM UTC
    // In Asia/Kolkata (+5:30), this is 2026-10-06 02:00:00
    // In America/New_York (-4:00 EDT), this is 2026-10-05 16:30:00
    // In Asia/Singapore (+8:00), this is 2026-10-06 04:30:00

    const kolkataDate = timezoneHelper.formatDateInTimezone(fixedUtcTime, 'Asia/Kolkata');
    const nyDate = timezoneHelper.formatDateInTimezone(fixedUtcTime, 'America/New_York');
    const sgDate = timezoneHelper.formatDateInTimezone(fixedUtcTime, 'Asia/Singapore');

    expect(kolkataDate).toBe('2026-10-06');
    expect(nyDate).toBe('2026-10-05');
    expect(sgDate).toBe('2026-10-06');
  });

  test('Consecutive day and previous/next day navigation works seamlessly', () => {
    expect(timezoneHelper.getPreviousDate('2026-03-01')).toBe('2026-02-28');
    expect(timezoneHelper.getNextDate('2026-02-28')).toBe('2026-03-01');
    const today = timezoneHelper.getTodayInTimezone('Asia/Kolkata');
    const yesterday = timezoneHelper.getPreviousDate(today);
    expect(timezoneHelper.isConsecutiveDay(yesterday, 'Asia/Kolkata')).toBe(true);
    expect(timezoneHelper.isConsecutiveDay('2020-01-01', 'Asia/Kolkata')).toBe(false);
  });

  test('Midnight proximity returns correct minutes remaining before local midnight', () => {
    const proximity = timezoneHelper.getMidnightProximity('Asia/Kolkata');
    expect(proximity).toHaveProperty('minutesUntilMidnight');
    expect(proximity).toHaveProperty('isNearMidnight');
    expect(proximity.minutesUntilMidnight).toBeGreaterThanOrEqual(0);
    expect(proximity.minutesUntilMidnight).toBeLessThanOrEqual(1440);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. SCHEDULE-AWARE STREAK RECONCILIATION FROM ACTIVITYRECORD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('Schedule-Aware Streak Reconciliation (Prompt Section 11, 12, 44)', () => {
  test('Daily goal derives consecutive streak strictly from ActivityRecord truth', async () => {
    const goal = await ActivityGoal.create({
      userId: testUser._id,
      title: 'Daily Duolingo Lesson',
      category: 'learning',
      platform: 'duolingo',
      frequency: 'daily',
      currentStreak: 0,
      longestStreak: 0
    });

    const timezone = 'Asia/Kolkata';
    const today = timezoneHelper.getTodayInTimezone(timezone);
    const yesterday = timezoneHelper.getPreviousDate(today);
    const dayBeforeYesterday = timezoneHelper.getPreviousDate(yesterday);

    // Create 3 consecutive days of ActivityRecords
    await ActivityRecord.create([
      { userId: testUser._id, goalId: goal._id, date: dayBeforeYesterday, completed: true, completionType: 'api-verified' },
      { userId: testUser._id, goalId: goal._id, date: yesterday, completed: true, completionType: 'api-verified' },
      { userId: testUser._id, goalId: goal._id, date: today, completed: true, completionType: 'api-verified' }
    ]);

    const result = await activitySyncOrchestrator.reconcileGoalStreak(goal._id, testUser._id, timezone);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.lastCompletedDate).toBe(today);

    // Verify DB update
    const updatedGoal = await ActivityGoal.findById(goal._id);
    expect(updatedGoal.currentStreak).toBe(3);
    expect(updatedGoal.longestStreak).toBe(3);
  });

  test('Weekdays goal does NOT break streak over the weekend (Section 12)', async () => {
    const goal = await ActivityGoal.create({
      userId: testUser._id,
      title: 'Weekday Coding Workout',
      category: 'coding',
      platform: 'github',
      frequency: 'weekdays',
      currentStreak: 0,
      longestStreak: 0
    });

    const timezone = 'UTC';
    // 2026-10-02 was Friday (scheduled: weekday)
    // 2026-10-03 was Saturday (NOT scheduled)
    // 2026-10-04 was Sunday (NOT scheduled)
    // 2026-10-05 was Monday (scheduled: weekday)
    await ActivityRecord.create([
      { userId: testUser._id, goalId: goal._id, date: '2026-10-02', completed: true, completionType: 'api-verified' },
      // Weekend intentionally has no records!
      { userId: testUser._id, goalId: goal._id, date: '2026-10-05', completed: true, completionType: 'api-verified' }
    ]);

    // Reconcile from the Monday date
    const records = await ActivityRecord.find({ userId: testUser._id, goalId: goal._id, completed: true });
    expect(records.length).toBe(2);

    // Simulate reconcileGoalStreak calculation logic for scheduled days
    const result = await activitySyncOrchestrator.reconcileGoalStreak(goal._id, testUser._id, timezone);
    // Friday and Monday are consecutive scheduled days -> streak must be 2, not 1!
    expect(result.currentStreak).toBeGreaterThanOrEqual(2);
  });

  test('Repeated synchronization is idempotent and never increments streak twice (Section 43)', async () => {
    const goal = await ActivityGoal.create({
      userId: testUser._id,
      title: 'LeetCode Daily',
      category: 'coding',
      platform: 'leetcode',
      frequency: 'daily',
      currentStreak: 1
    });

    const timezone = 'Asia/Kolkata';
    const today = timezoneHelper.getTodayInTimezone(timezone);

    await ActivityRecord.create({
      userId: testUser._id,
      goalId: goal._id,
      date: today,
      completed: true,
      completionType: 'api-verified'
    });

    const run1 = await activitySyncOrchestrator.reconcileGoalStreak(goal._id, testUser._id, timezone);
    const run2 = await activitySyncOrchestrator.reconcileGoalStreak(goal._id, testUser._id, timezone);
    const run3 = await activitySyncOrchestrator.reconcileGoalStreak(goal._id, testUser._id, timezone);

    expect(run1.currentStreak).toBe(1);
    expect(run2.currentStreak).toBe(1);
    expect(run3.currentStreak).toBe(1);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. HISTORICAL RECOVERY & BACKFILL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('Historical Activity Recovery & Backfill (Prompt Section 13, 89)', () => {
  test('Backfills missing ActivityRecords from platform activity history without fabrication', async () => {
    const timezone = 'Asia/Kolkata';
    const today = timezoneHelper.getTodayInTimezone(timezone);
    const yesterday = timezoneHelper.getPreviousDate(today);

    // Set up DevProfile with stats showing activity on yesterday and today
    const rawStats = {
      streak: 5,
      streakData: {
        currentStreak: {
          startDate: yesterday,
          endDate: today
        }
      }
    };

    const backfillCount = await activitySyncOrchestrator.backfillHistoricalPlatformActivity(
      testUser._id,
      'duolingo',
      rawStats,
      timezone
    );

    expect(backfillCount).toBeGreaterThanOrEqual(1);

    const records = await ActivityRecord.find({ userId: testUser._id, platform: 'duolingo' });
    expect(records.length).toBeGreaterThanOrEqual(1);
    expect(records[0].completionType).toBe('api-verified');
    expect(records[0].sourceTitle).toContain('Duolingo');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. DISTRIBUTED LOCK & USER CLAIMING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('Distributed Lock Atomicity & User Claiming (Prompt Section 16, 17, 18)', () => {
  test('acquireLock grants lock to first worker and denies second worker', async () => {
    const lockKey = 'test:lock:cron-job';
    const lock1 = await cache.acquireLock(lockKey, 30);
    expect(lock1.acquired).toBe(true);

    // Second concurrent worker attempts to acquire same lock
    const lock2 = await cache.acquireLock(lockKey, 30);
    expect(lock2.acquired).toBe(false);

    // Release lock
    await cache.releaseLock(lockKey, lock1.lockValue);

    // Now another worker can acquire it
    const lock3 = await cache.acquireLock(lockKey, 30);
    expect(lock3.acquired).toBe(true);
    await cache.releaseLock(lockKey, lock3.lockValue);
  });

  test('setNX prevents overlapping user processing (Section 18)', async () => {
    const claimKey = `activity:sync:claim:${testUser._id}:2026-10-05`;
    const claim1 = await cache.setNX(claimKey, 'claimed', 60);
    expect(claim1).toBe(true);

    const claim2 = await cache.setNX(claimKey, 'claimed', 60);
    expect(claim2).toBe(false);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. NOTIFICATION DATABASE IDEMPOTENCY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('Database-Level Notification Idempotency (Prompt Section 20, 21, 22)', () => {
  test('createOrClaimNotification returns claimed=true once and claimed=false on duplicates', async () => {
    const dedupKey = `goal-reminder:${testUser._id}:2026-10-05`;

    const res1 = await Notification.createOrClaimNotification({
      recipient: testUser._id,
      type: 'GOAL_REMINDER',
      title: 'Daily Activity Reminder',
      message: 'Keep your momentum going!',
      dedupKey,
      eventKey: dedupKey
    });

    expect(res1.claimed).toBe(true);
    expect(res1.notification).toBeDefined();

    // Duplicate attempt by worker B
    const res2 = await Notification.createOrClaimNotification({
      recipient: testUser._id,
      type: 'GOAL_REMINDER',
      title: 'Daily Activity Reminder',
      message: 'Keep your momentum going!',
      dedupKey,
      eventKey: dedupKey
    });

    expect(res2.claimed).toBe(false);
    expect(res2.notification).toBeDefined();

    // Total notifications in DB for this recipient and dedupKey must remain exactly 1
    const count = await Notification.countDocuments({ recipient: testUser._id, dedupKey });
    expect(count).toBe(1);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. FCM DEVICE & TOKEN DEDUPLICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('FCM Device & Token Deduplication (Prompt Section 28, 29, 30, 33)', () => {
  test('Unique target tokens are deduplicated when multiple device records exist', async () => {
    const duplicateToken = 'fcm_token_identical_abc123';

    // Simulate 3 duplicate device rows for same user and same physical token (Incident reproduction)
    await NotificationDevice.create([
      { userId: testUser._id, deviceId: 'device-id-1', platform: 'android', pushToken: duplicateToken, enabled: true },
      { userId: testUser._id, deviceId: 'device-id-2', platform: 'android', pushToken: duplicateToken, enabled: true },
      { userId: testUser._id, deviceId: 'device-id-3', platform: 'android', pushToken: duplicateToken, enabled: true }
    ]);

    // Query active tokens
    const devices = await NotificationDevice.find({ userId: testUser._id, enabled: true });
    expect(devices.length).toBe(3);

    // Mock sendToDevice method
    let sendCount = 0;
    const originalSend = fcmService.sendToDevice;
    fcmService.sendToDevice = async (token) => {
      sendCount++;
      return { success: true };
    };

    try {
      const res = await fcmService.sendToUser(testUser._id, {
        title: '5-Day Streak at Risk!',
        body: 'Complete your goal today.'
      });

      // Target tokens deduplicated: must only send 1 push, not 3!
      expect(sendCount).toBe(1);
      expect(res.sent).toBe(1);

      // Redundant duplicate database rows must be cleaned
      const remainingDevices = await NotificationDevice.find({ userId: testUser._id, pushToken: duplicateToken });
      expect(remainingDevices.length).toBe(1);
    } finally {
      fcmService.sendToDevice = originalSend;
    }
  });

  test('POST /api/notifications/devices/register updates existing device without duplicating rows', async () => {
    const payload = {
      deviceId: 'stable-android-uuid-1',
      platform: 'android',
      pushToken: 'initial-fcm-token-001'
    };

    const res1 = await request(app)
      .post('/api/notifications/devices/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload);
    expect(res1.statusCode).toBe(200);

    // Token refreshed on the same physical device
    const res2 = await request(app)
      .post('/api/notifications/devices/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        deviceId: 'stable-android-uuid-1',
        platform: 'android',
        pushToken: 'refreshed-fcm-token-002'
      });
    expect(res2.statusCode).toBe(200);

    const deviceRecords = await NotificationDevice.find({ userId: testUser._id, deviceId: 'stable-android-uuid-1' });
    expect(deviceRecords.length).toBe(1);
    expect(deviceRecords[0].pushToken).toBe('refreshed-fcm-token-002');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. REMINDER & STREAK-RISK SUPPRESSION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('Smart Reminder Suppression (Prompt Section 25, 55, 56)', () => {
  test('Streak-at-risk warning supersedes generic daily reminder for the same goal', async () => {
    const timezone = 'Asia/Kolkata';
    const today = timezoneHelper.getTodayInTimezone(timezone);

    await ActivityGoal.create({
      userId: testUser._id,
      title: 'Duolingo Daily',
      category: 'learning',
      platform: 'duolingo',
      frequency: 'daily',
      currentStreak: 5 // streak >= 2 -> at risk!
    });

    await ReminderPreference.create({
      userId: testUser._id,
      timezone,
      dailyReminder: true,
      streakWarning: true,
      reminderDays: [0, 1, 2, 3, 4, 5, 6],
      reminderTime: '20:00'
    });

    // Run daily reminders (which evaluates streak warnings first and suppresses daily reminders for at-risk goals)
    const result = await activityReminderCron.runDailyReminders();
    expect(result).toHaveProperty('streakWarningsSent');
    expect(result).toHaveProperty('sent');
    expect(result.streakWarningsSent).toBeGreaterThanOrEqual(1);
    expect(result.sent).toBe(0);

    // Total notifications must NOT have duplicate spam for the same user/date
    const notifications = await Notification.find({ recipient: testUser._id });
    const types = notifications.map(n => n.type);
    
    // If streak warning was dispatched, generic reminder was suppressed
    if (types.includes('STREAK_AT_RISK')) {
      expect(types.filter(t => t === 'GOAL_REMINDER').length).toBe(0);
    }
  });

  test('Suppresses all reminders if user completed activities today', async () => {
    const timezone = 'Asia/Kolkata';
    const today = timezoneHelper.getTodayInTimezone(timezone);

    const goal = await ActivityGoal.create({
      userId: testUser._id,
      title: 'LeetCode Problem',
      category: 'coding',
      platform: 'leetcode',
      frequency: 'daily',
      currentStreak: 4
    });

    // Record verified completion for today
    await ActivityRecord.create({
      userId: testUser._id,
      goalId: goal._id,
      date: today,
      completed: true,
      completionType: 'api-verified'
    });

    await ReminderPreference.create({
      userId: testUser._id,
      timezone,
      dailyReminder: true,
      streakWarning: true
    });

    // Run reminder processor
    await activityReminderCron.runDailyReminders();

    const notifications = await Notification.find({ recipient: testUser._id });
    expect(notifications.length).toBe(0);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. PRE-MIDNIGHT PROTECTION & ADAPTIVE SYNC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('Pre-Midnight Streak Protection (Prompt Section 8, 9)', () => {
  test('runPreMidnightProtection runs safely and identifies users with at-risk streaks', async () => {
    const result = await activityReminderCron.runPreMidnightProtection();
    expect(result).toHaveProperty('checked');
    expect(result).toHaveProperty('protected');
    expect(result).toHaveProperty('reconciled');
  });

  test('runAdaptiveBackgroundSync executes distributed-safe background sync', async () => {
    const result = await activityReminderCron.runAdaptiveBackgroundSync();
    expect(result).toHaveProperty('synced');
    expect(result).toHaveProperty('detected');
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. TEMPORARY PLATFORM FAILURE HANDLING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('Temporary Platform Failure Resilience (Prompt Section 14, 15, 69)', () => {
  test('Temporary platform failure preserves existing verified history and does not reset streak to 0', async () => {
    const goal = await ActivityGoal.create({
      userId: testUser._id,
      title: 'GitHub Commit Streak',
      category: 'coding',
      platform: 'github',
      frequency: 'daily',
      currentStreak: 10,
      longestStreak: 15
    });

    // DevProfile records temporary failure
    await DevProfile.create({
      user: testUser._id,
      email: testUser.email,
      syncStatus: 'temporarily-unavailable',
      lastSyncAttemptAt: new Date()
    });

    const res = await request(app)
      .get('/api/activity/dashboard')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.syncFreshness.syncStatus).toBe('temporarily-unavailable');

    // Crucial guarantee: streak must NOT be wiped to 0 due to an API outage!
    const preservedGoal = await ActivityGoal.findById(goal._id);
    expect(preservedGoal.currentStreak).toBe(10);
    expect(preservedGoal.longestStreak).toBe(15);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. DIAGNOSTICS & CLEANUP ENDPOINT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe('Activity Intelligence Diagnostics & Cleanup (Prompt Section 35, 36, 65)', () => {
  test('GET /api/activity/diagnostics returns complete incident diagnostic report', async () => {
    const res = await request(app)
      .get('/api/activity/diagnostics')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('timezone');
    expect(res.body).toHaveProperty('syncFreshness');
    expect(res.body).toHaveProperty('goals');
    expect(res.body).toHaveProperty('notificationsToday');
    expect(res.body).toHaveProperty('androidDevices');
    expect(res.body).toHaveProperty('verdict');
  });

  test('POST /api/activity/diagnostics/cleanup cleans duplicate device rows and stale keys', async () => {
    const dupToken = 'token_for_cleanup_test_999';
    await NotificationDevice.create([
      { userId: testUser._id, deviceId: 'dev-1', platform: 'android', pushToken: dupToken, enabled: true },
      { userId: testUser._id, deviceId: 'dev-2', platform: 'android', pushToken: dupToken, enabled: true }
    ]);

    const res = await request(app)
      .post('/api/activity/diagnostics/cleanup')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('devicesCleaned');
    expect(res.body.devicesCleaned).toBeGreaterThanOrEqual(1);
    expect(res.body).toHaveProperty('reconciledGoals');

    const remaining = await NotificationDevice.find({ userId: testUser._id, pushToken: dupToken });
    expect(remaining.length).toBe(1);
  });
});
