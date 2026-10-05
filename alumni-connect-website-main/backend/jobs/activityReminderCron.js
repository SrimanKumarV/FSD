const cron = require('node-cron');
const User = require('../models/User');
const ActivityGoal = require('../models/ActivityGoal');
const ActivityRecord = require('../models/ActivityRecord');
const ReminderPreference = require('../models/ReminderPreference');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');
const cache = require('../utils/cache');
const {
  getDailyReminderTemplate,
  getStreakWarningTemplate,
  getWeeklyActivitySummaryTemplate
} = require('../utils/activityEmailTemplates');
const {
  getTodayInTimezone,
  formatDateInTimezone,
  getDayOfWeekInTimezone,
  getPreviousDate,
  getMidnightProximity,
  isQuietHours,
  isReminderDay
} = require('../utils/timezoneHelper');
const {
  syncUserActivityIntelligence,
  reconcileGoalStreak
} = require('../services/activitySyncOrchestrator');
const { notificationDispatcher, NOTIFICATION_TYPES } = require('../services/notificationDispatcher');

// Environment Configuration (Phase 7 & 53)
const ACTIVITY_BACKGROUND_SYNC_MINUTES = parseInt(process.env.ACTIVITY_BACKGROUND_SYNC_MINUTES, 10) || 30;
const ACTIVITY_PRE_DEADLINE_SYNC_MINUTES = parseInt(process.env.ACTIVITY_PRE_DEADLINE_SYNC_MINUTES, 10) || 60;
const ACTIVITY_FINAL_PROTECTION_SYNC_MINUTES = parseInt(process.env.ACTIVITY_FINAL_PROTECTION_SYNC_MINUTES, 10) || 15;
const ACTIVITY_SYNC_ENABLED = process.env.ACTIVITY_SYNC_ENABLED !== 'false';
const ACTIVITY_REMINDER_ENABLED = process.env.ACTIVITY_REMINDER_ENABLED !== 'false';

/**
 * Generate canonical notification event key
 */
function getCanonicalNotifKey(type, userId, date, extra = '') {
  if (type === 'daily-reminder') {
    return `goal-reminder:${userId}:${date}`;
  }
  if (type === 'streak-risk') {
    return `streak-risk:${userId}:${extra}:${date}`;
  }
  return `activity:notif:${userId}:${type}:${date}${extra ? `:${extra}` : ''}`;
}

/**
 * Process daily reminders with distributed lock and fresh remote verification
 */
const runDailyReminders = async () => {
  if (!ACTIVITY_REMINDER_ENABLED) {
    console.log('[Activity Cron] Reminders disabled by ACTIVITY_REMINDER_ENABLED.');
    return { skipped: true };
  }

  const startTime = Date.now();
  console.log('[Activity Cron] Attempting to acquire distributed lock for daily reminders...');

  // Phase 9 & 17: Acquire atomic distributed lock (5-minute TTL)
  const lockKey = 'activity:cron:lock:daily-reminders';
  const { acquired, lockValue } = await cache.acquireLock(lockKey, 300);

  if (!acquired) {
    console.log('[Activity Cron] Another scheduler worker holds the lock. Skipping duplicate execution.');
    return { locked: true, skipped: true };
  }

  const results = { sent: 0, skipped: 0, errors: 0, quiet: 0, alreadySent: 0, streakWarningsSent: 0 };

  try {
    // Select users with active enabled goals
    const usersWithGoals = await ActivityGoal.distinct('userId', { enabled: true });
    if (usersWithGoals.length === 0) {
      console.log('[Activity Cron] No users with active goals.');
      return results;
    }

    console.log(`[Activity Cron] Processing reminders for ${usersWithGoals.length} users with active goals...`);

    for (const userId of usersWithGoals) {
      try {
        const prefs = await ReminderPreference.findOne({ userId }).lean();

        // Check if reminders are enabled by user
        if (prefs && prefs.dailyReminder === false && prefs.streakAlert === false) {
          results.skipped++;
          continue;
        }

        const tz = prefs?.timezone || 'Asia/Kolkata';
        const today = getTodayInTimezone(tz);

        // Phase 9 & 18: User-level idempotent claim
        const userClaimKey = `activity:claim:reminders:${userId}:${today}`;
        const userClaimed = await cache.setNX(userClaimKey, true, 7200);
        if (!userClaimed) {
          results.alreadySent++;
          continue;
        }

        // Check quiet hours
        if (isQuietHours(prefs)) {
          results.quiet++;
          continue;
        }

        // Check reminder day
        if (!isReminderDay(prefs)) {
          results.skipped++;
          continue;
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // STEP 1: FRESH REMOTE VERIFICATION (Phases 3, 4, 10)
        // Never evaluate stale state! Fetch fresh external activities first.
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        try {
          await syncUserActivityIntelligence(userId, {
            timezone: tz,
            forceRemote: true,
            reason: 'pre-reminder'
          });
        } catch (syncErr) {
          console.warn(`[Activity Cron] Pre-reminder sync warning for user ${userId}:`, syncErr.message);
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // STEP 2: RE-EVALUATE GOALS & STREAKS AFTER SYNC
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const goals = await ActivityGoal.find({ userId, enabled: true }).lean();
        const todayRecords = await ActivityRecord.find({ userId, date: today, completed: true }).lean();
        const completedGoalIds = new Set(todayRecords.filter(r => r.goalId).map(r => r.goalId.toString()));

        // Also check if platform-level completion covers goals
        const completedPlatforms = new Set(todayRecords.filter(r => r.platform).map(r => r.platform));

        const pendingGoals = goals.filter(g => {
          if (completedGoalIds.has(g._id.toString())) return false;
          if (g.platform && completedPlatforms.has(g.platform)) return false;
          return true;
        });

        // If all goals are completed today, suppress reminders
        if (pendingGoals.length === 0) {
          results.skipped++;
          continue;
        }

        // Fetch user data for notification/email
        const user = await User.findById(userId).select('name email').lean();
        if (!user) {
          results.skipped++;
          continue;
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // STEP 3: SMART NOTIFICATION SUPPRESSION (Phases 13 & 25)
        // If a pending goal has currentStreak >= 3, it qualifies for a streak warning.
        // A streak warning supersedes the generic daily reminder to prevent duplicate spam!
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const atRiskGoals = pendingGoals.filter(g => (g.currentStreak || 0) >= 3);
        const streakAlertsAllowed = prefs ? prefs.streakAlert !== false : true;
        const dailyReminderAllowed = prefs ? prefs.dailyReminder !== false : true;

        let streakWarningDispatched = false;

        if (streakAlertsAllowed && atRiskGoals.length > 0) {
          for (const atRiskGoal of atRiskGoals) {
            const streakDedupKey = getCanonicalNotifKey('streak-risk', userId, today, atRiskGoal._id.toString());

            const dispatchRes = await notificationDispatcher.dispatch({
              type: NOTIFICATION_TYPES.STREAK_AT_RISK,
              userId,
              title: `🔥 ${atRiskGoal.currentStreak}-Day Streak at Risk!`,
              body: `Your "${atRiskGoal.title}" goal hasn't been completed today. Complete it before midnight to maintain your streak!`,
              priority: 'high',
              deepLink: '/activity?tab=today',
              data: { goalId: atRiskGoal._id.toString(), streak: atRiskGoal.currentStreak, date: today },
              dedupKey: streakDedupKey
            });

            if (dispatchRes.success && !dispatchRes.deduplicated) {
              results.streakWarningsSent++;
              streakWarningDispatched = true;
            }
          }
        }

        // Phase 13 & 25: Only send generic daily reminder if:
        // 1. User has daily reminders enabled
        // 2. AND either no streak warnings were sent OR there are other pending goals not covered by streak warning
        const remainingUnwarnedGoals = pendingGoals.filter(g => (g.currentStreak || 0) < 3);

        if (dailyReminderAllowed && (!streakWarningDispatched || remainingUnwarnedGoals.length > 0)) {
          const dailyDedupKey = getCanonicalNotifKey('daily-reminder', userId, today);
          const maxStreak = goals.reduce((max, g) => Math.max(max, g.currentStreak || 0), 0);

          let reminderTitle = '🔔 Daily Activity Reminder';
          let reminderContent = '';
          if (pendingGoals.length === 1) {
            const single = pendingGoals[0];
            reminderTitle = `Keep your habit alive!`;
            reminderContent = `1 goal left today: "${single.title}"${single.estimatedMinutes ? ` (~${single.estimatedMinutes} min)` : ''}.`;
          } else {
            reminderContent = `You have ${pendingGoals.length} goals remaining today. Maintain your momentum!`;
          }

          const dailyRes = await notificationDispatcher.dispatch({
            type: NOTIFICATION_TYPES.GOAL_REMINDER,
            userId,
            title: reminderTitle,
            body: reminderContent,
            priority: maxStreak >= 7 ? 'high' : 'normal',
            deepLink: '/activity?tab=today',
            data: { pendingCount: pendingGoals.length, maxStreak, date: today },
            dedupKey: dailyDedupKey
          });

          if (dailyRes.success && !dailyRes.deduplicated) {
            results.sent++;
          }
        }

        // Small throttle between users to protect CPU/network
        await new Promise(r => setTimeout(r, 100));

      } catch (userErr) {
        console.error(`[Activity Cron] Error processing user ${userId}:`, userErr.message);
        results.errors++;
      }
    }

  } catch (error) {
    console.error('[Activity Cron] Critical error during daily reminder processing:', error);
  } finally {
    // Release distributed lock
    await cache.releaseLock(lockKey, lockValue).catch(() => {});
  }

  const duration = Date.now() - startTime;
  console.log(`[Activity Cron] Completed daily reminders in ${duration}ms. Daily sent: ${results.sent}, Streak warnings: ${results.streakWarningsSent}, Skipped: ${results.skipped}, AlreadySent: ${results.alreadySent}, Quiet: ${results.quiet}, Errors: ${results.errors}`);
  return results;
};

/**
 * Pre-Midnight Streak Protection Run (Phase 8 & 9)
 * Identifies users whose local deadline is approaching and performs fresh remote sync
 * to prevent false streak resets.
 */
const runPreMidnightProtection = async () => {
  if (!ACTIVITY_SYNC_ENABLED) return { skipped: true };

  const startTime = Date.now();
  const lockKey = 'activity:cron:lock:pre-midnight';
  const { acquired, lockValue } = await cache.acquireLock(lockKey, 300);

  if (!acquired) {
    return { locked: true, skipped: true };
  }

  const results = { checked: 0, protected: 0, reconciled: 0, errors: 0 };

  try {
    // Select users with active streaks (currentStreak >= 1) on automatic/hybrid goals
    const atRiskGoals = await ActivityGoal.find({
      enabled: true,
      currentStreak: { $gte: 1 },
      trackingMode: { $in: ['automatic', 'hybrid'] }
    }).lean();

    const userIds = Array.from(new Set(atRiskGoals.map(g => g.userId.toString())));

    for (const userId of userIds) {
      try {
        const prefs = await ReminderPreference.findOne({ userId }).lean();
        const tz = prefs?.timezone || 'Asia/Kolkata';
        const { minutesUntilMidnight, localDate } = getMidnightProximity(tz);

        // Check if user is in the protection window (e.g. <= 60 minutes before local midnight)
        if (minutesUntilMidnight <= ACTIVITY_PRE_DEADLINE_SYNC_MINUTES) {
          results.checked++;

          // Check if goal was already completed today
          const todayRecords = await ActivityRecord.find({
            userId,
            date: localDate,
            completed: true
          }).lean();

          const completedGoalIds = new Set(todayRecords.filter(r => r.goalId).map(r => r.goalId.toString()));
          const userGoals = atRiskGoals.filter(g => g.userId.toString() === userId);
          const pendingAtRisk = userGoals.filter(g => !completedGoalIds.has(g._id.toString()));

          if (pendingAtRisk.length > 0) {
            // Perform fresh remote verification
            const syncRes = await syncUserActivityIntelligence(userId, {
              timezone: tz,
              forceRemote: true,
              reason: 'pre-midnight'
            });

            if (syncRes.goalsVerified?.length > 0 || syncRes.activitiesDetected?.length > 0) {
              results.protected++;
              console.log(`[Activity Cron] Pre-midnight protection saved activity/streak for user ${userId} (${minutesUntilMidnight}m until midnight)`);
            }
          }
        }
      } catch (userErr) {
        console.warn(`[Activity Cron] Pre-midnight error for user ${userId}:`, userErr.message);
        results.errors++;
      }
    }
  } catch (err) {
    console.error('[Activity Cron] Pre-midnight protection error:', err);
  } finally {
    await cache.releaseLock(lockKey, lockValue).catch(() => {});
  }

  const duration = Date.now() - startTime;
  if (results.checked > 0) {
    console.log(`[Activity Cron] Pre-midnight check in ${duration}ms: Checked ${results.checked} users, Protected ${results.protected}`);
  }
  return results;
};

/**
 * Adaptive Background Synchronization (Phase 7)
 * Runs periodically to keep automatic/hybrid goals synced without hammering APIs
 */
const runAdaptiveBackgroundSync = async () => {
  if (!ACTIVITY_SYNC_ENABLED) return { skipped: true };

  const lockKey = 'activity:cron:lock:background-sync';
  const { acquired, lockValue } = await cache.acquireLock(lockKey, 600);
  if (!acquired) return { locked: true, skipped: true };

  const results = { synced: 0, detected: 0, errors: 0 };

  try {
    // Only select users who actually have automatic or hybrid goals
    const usersWithAutoGoals = await ActivityGoal.distinct('userId', {
      enabled: true,
      trackingMode: { $in: ['automatic', 'hybrid'] }
    });

    for (const userId of usersWithAutoGoals) {
      try {
        const prefs = await ReminderPreference.findOne({ userId }).lean();
        const tz = prefs?.timezone || 'Asia/Kolkata';

        const syncRes = await syncUserActivityIntelligence(userId, {
          timezone: tz,
          forceRemote: true,
          reason: 'background-sync'
        });

        results.synced++;
        results.detected += syncRes.activitiesDetected?.length || 0;

        // Controlled concurrency delay between users
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        results.errors++;
      }
    }
  } catch (err) {
    console.error('[Activity Cron] Adaptive sync critical error:', err);
  } finally {
    await cache.releaseLock(lockKey, lockValue).catch(() => {});
  }

  console.log(`[Activity Cron] Adaptive background sync completed: ${results.synced} users synced, ${results.detected} activities detected.`);
  return results;
};

/**
 * Process weekly summaries (run on Sundays)
 */
const runWeeklySummaries = async () => {
  const lockKey = 'activity:cron:lock:weekly-summary';
  const { acquired, lockValue } = await cache.acquireLock(lockKey, 600);
  if (!acquired) return { locked: true, skipped: true };

  console.log('[Activity Cron] Starting weekly summary processing...');
  const results = { sent: 0, skipped: 0, errors: 0 };

  try {
    const prefs = await ReminderPreference.find({ weeklySummary: true });
    const { getWeeklySummary } = require('../services/activityService');

    for (const pref of prefs) {
      try {
        const tz = pref.timezone || 'Asia/Kolkata';
        const today = getTodayInTimezone(tz);

        const summaryDedupKey = `weekly-summary:${pref.userId}:${today}`;
        const alreadyClaimed = await cache.setNX(`notif:dedup:${summaryDedupKey}`, true, 86400 * 3);
        if (!alreadyClaimed) {
          results.skipped++;
          continue;
        }

        const user = await User.findById(pref.userId).select('name email').lean();
        if (!user) continue;

        const summary = await getWeeklySummary(pref.userId, tz);

        if (summary.goalsCompleted === 0 && summary.coding?.activeDays === 0 && summary.learning?.activeDays === 0) {
          results.skipped++;
          continue;
        }

        if (pref.emailEnabled !== false && user.email) {
          const html = getWeeklyActivitySummaryTemplate(user, summary);
          await sendEmail({
            email: user.email,
            subject: '📊 Your Alumnex Weekly Activity Summary',
            message: html
          });
        }

        if (pref.inAppEnabled !== false) {
          await Notification.createOrClaimNotification({
            recipient: pref.userId,
            type: 'activity-weekly-summary',
            title: '📊 Weekly Activity Summary',
            content: `This week: ${summary.goalsCompleted} goals completed, ${summary.coding?.activeDays || 0}/7 coding days, ${summary.learning?.activeDays || 0}/7 learning days.`,
            priority: 'low',
            metadata: { source: 'system', category: 'activity' },
            actionUrl: '/activity',
            dedupKey: summaryDedupKey
          });
        }

        results.sent++;
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`[Activity Cron] Weekly summary error for user ${pref.userId}:`, err.message);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('[Activity Cron] Weekly summary critical error:', error);
  } finally {
    await cache.releaseLock(lockKey, lockValue).catch(() => {});
  }

  console.log(`[Activity Cron] Weekly summary completed: Sent ${results.sent}, Skipped ${results.skipped}, Errors ${results.errors}`);
  return results;
};

/**
 * Initialize all activity intelligence cron jobs
 */
const initActivityCron = () => {
  // 1. Daily reminders schedule (default every 2 hours)
  const dailySchedule = process.env.ACTIVITY_REMINDER_CRON || '0 */2 * * *';
  cron.schedule(dailySchedule, async () => {
    console.log(`[Activity CRON] Triggering distributed daily reminders (${dailySchedule})...`);
    await runDailyReminders();
  });

  // 2. Pre-midnight streak protection (every 15 minutes)
  const protectionSchedule = '*/15 * * * *';
  cron.schedule(protectionSchedule, async () => {
    await runPreMidnightProtection();
  });

  // 3. Adaptive background sync for automatic/hybrid goals (every 30 minutes)
  const bgSyncSchedule = `*/${ACTIVITY_BACKGROUND_SYNC_MINUTES} * * * *`;
  cron.schedule(bgSyncSchedule, async () => {
    await runAdaptiveBackgroundSync();
  });

  // 4. Weekly summaries — Sunday at 10 AM
  const weeklySchedule = process.env.ACTIVITY_WEEKLY_CRON || '0 10 * * 0';
  cron.schedule(weeklySchedule, async () => {
    console.log(`[Activity CRON] Triggering weekly summaries (${weeklySchedule})...`);
    await runWeeklySummaries();
  });

  console.log(`[Activity CRON] Distributed Activity Intelligence Scheduled:
  - Daily Reminders: "${dailySchedule}" (Distributed Lock Protected)
  - Pre-Midnight Protection: "${protectionSchedule}" (<= ${ACTIVITY_PRE_DEADLINE_SYNC_MINUTES}m window)
  - Adaptive Background Sync: "${bgSyncSchedule}" (Interval: ${ACTIVITY_BACKGROUND_SYNC_MINUTES}m)
  - Weekly Summaries: "${weeklySchedule}"`);
};

module.exports = initActivityCron;
module.exports.runDailyReminders = runDailyReminders;
module.exports.runPreMidnightProtection = runPreMidnightProtection;
module.exports.runAdaptiveBackgroundSync = runAdaptiveBackgroundSync;
module.exports.runWeeklySummaries = runWeeklySummaries;
