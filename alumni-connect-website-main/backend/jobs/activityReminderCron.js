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
const { getWeeklySummary, getTodayInTimezone } = require('../services/activityService');

/**
 * Check if the current time is within quiet hours for a user
 */
function isQuietHours(prefs) {
  if (!prefs?.quietHoursEnabled) return false;
  
  const tz = prefs.timezone || 'Asia/Kolkata';
  let nowHour, nowMinute;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', minute: 'numeric', hour12: false
    }).formatToParts(new Date());
    nowHour = parseInt(parts.find(p => p.type === 'hour').value, 10);
    nowMinute = parseInt(parts.find(p => p.type === 'minute').value, 10);
  } catch {
    return false;
  }

  const [startH, startM] = (prefs.quietHoursStart || '22:00').split(':').map(Number);
  const [endH, endM] = (prefs.quietHoursEnd || '07:00').split(':').map(Number);
  
  const nowMins = nowHour * 60 + nowMinute;
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;

  if (startMins <= endMins) {
    // Simple range (e.g., 08:00 - 18:00)
    return nowMins >= startMins && nowMins < endMins;
  } else {
    // Overnight range (e.g., 22:00 - 07:00)
    return nowMins >= startMins || nowMins < endMins;
  }
}

/**
 * Check if today is a reminder day for this user
 */
function isReminderDay(prefs) {
  const tz = prefs?.timezone || 'Asia/Kolkata';
  let dayOfWeek;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, weekday: 'short'
    }).formatToParts(new Date());
    const dayStr = parts.find(p => p.type === 'weekday').value;
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    dayOfWeek = dayMap[dayStr] ?? new Date().getDay();
  } catch {
    dayOfWeek = new Date().getDay();
  }

  const reminderDays = prefs?.reminderDays || [1, 2, 3, 4, 5];
  return reminderDays.includes(dayOfWeek);
}

/**
 * Generate a unique notification key for deduplication
 */
function getNotificationKey(userId, type, date) {
  return `activity:notif:${userId}:${type}:${date}`;
}

/**
 * Check if a notification has already been sent (anti-spam)
 */
async function wasAlreadySent(userId, type, date) {
  const key = getNotificationKey(userId, type, date);
  const sent = await cache.get(key);
  return !!sent;
}

/**
 * Mark a notification as sent
 */
async function markAsSent(userId, type, date) {
  const key = getNotificationKey(userId, type, date);
  // TTL of 25 hours ensures we don't re-send within the same day
  await cache.set(key, true, 90000);
}

/**
 * Process daily reminders for all users
 */
const runDailyReminders = async () => {
  const startTime = Date.now();
  console.log('[Activity Cron] Starting daily reminder processing...');

  const results = { sent: 0, skipped: 0, errors: 0, quiet: 0, alreadySent: 0 };

  try {
    // Get all users who have activity goals with reminders enabled
    const usersWithGoals = await ActivityGoal.distinct('userId', { enabled: true });
    if (usersWithGoals.length === 0) {
      console.log('[Activity Cron] No users with active goals.');
      return results;
    }

    // Process each user
    for (const userId of usersWithGoals) {
      try {
        const prefs = await ReminderPreference.findOne({ userId });
        
        // Skip if reminders are disabled
        if (prefs && !prefs.dailyReminder) {
          results.skipped++;
          continue;
        }

        // Skip if quiet hours
        if (isQuietHours(prefs)) {
          results.quiet++;
          continue;
        }

        // Skip if not a reminder day
        if (!isReminderDay(prefs)) {
          results.skipped++;
          continue;
        }

        const tz = prefs?.timezone || 'Asia/Kolkata';
        const today = getTodayInTimezone(tz);

        // Skip if already sent today (anti-spam)
        if (await wasAlreadySent(userId, 'daily', today)) {
          results.alreadySent++;
          continue;
        }

        // Get user's goals and today's completions
        const goals = await ActivityGoal.find({ userId, enabled: true }).lean();
        const todayRecords = await ActivityRecord.find({ userId, date: today, completed: true }).lean();
        const completedIds = new Set(todayRecords.map(r => r.goalId?.toString()));

        const pendingGoals = goals.filter(g => !completedIds.has(g._id.toString()));

        // If all goals completed, no reminder needed
        if (pendingGoals.length === 0) {
          results.skipped++;
          await markAsSent(userId, 'daily', today);
          continue;
        }

        // Get user info for email
        const user = await User.findById(userId).select('name email emailPreferences').lean();
        if (!user) {
          results.skipped++;
          continue;
        }

        // Calculate max streak for context
        const maxStreak = goals.reduce((max, g) => Math.max(max, g.currentStreak || 0), 0);

        // Create in-app notification
        if (!prefs || prefs.inAppEnabled !== false) {
          await Notification.createNotification({
            recipient: userId,
            type: 'activity-reminder',
            title: '🔔 Daily Activity Reminder',
            content: `You have ${pendingGoals.length} goal${pendingGoals.length !== 1 ? 's' : ''} remaining today. ${maxStreak > 0 ? `Your streak: ${maxStreak} days.` : ''}`,
            priority: 'normal',
            metadata: { source: 'system', category: 'activity' },
            actionUrl: '/activity'
          });
        }

        // Send email if enabled
        if (!prefs || prefs.emailEnabled !== false) {
          try {
            const html = getDailyReminderTemplate(user, pendingGoals, { currentStreak: maxStreak });
            await sendEmail({
              email: user.email,
              subject: '🔔 Your Alumnex Daily Activity Reminder',
              message: html
            });
          } catch (emailErr) {
            console.warn(`[Activity Cron] Email failed for ${user.email}:`, emailErr.message);
          }
        }

        await markAsSent(userId, 'daily', today);
        results.sent++;

        // Throttle to avoid overloading email provider
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (userErr) {
        console.error(`[Activity Cron] Error processing user ${userId}:`, userErr.message);
        results.errors++;
      }
    }

    // Also send streak-at-risk warnings
    await processStreakWarnings(results);

  } catch (error) {
    console.error('[Activity Cron] Critical error:', error);
  }

  const duration = Date.now() - startTime;
  console.log(`[Activity Cron] Completed in ${duration}ms. Sent: ${results.sent}, Skipped: ${results.skipped}, Quiet: ${results.quiet}, AlreadySent: ${results.alreadySent}, Errors: ${results.errors}`);
  return results;
};

/**
 * Process streak-at-risk warnings for users who haven't completed
 * goals today but have active streaks
 */
async function processStreakWarnings(results) {
  try {
    // Find goals with active streaks > 3 that haven't been completed today
    const atRiskGoals = await ActivityGoal.find({
      enabled: true,
      currentStreak: { $gte: 3 }
    }).lean();

    for (const goal of atRiskGoals) {
      const prefs = await ReminderPreference.findOne({ userId: goal.userId });
      if (prefs && !prefs.streakAlert) continue;
      if (isQuietHours(prefs)) continue;

      const tz = prefs?.timezone || 'Asia/Kolkata';
      const today = getTodayInTimezone(tz);

      // Check if already completed today
      const record = await ActivityRecord.findOne({
        userId: goal.userId, goalId: goal._id, date: today, completed: true
      });
      if (record) continue;

      // Check if already warned today
      if (await wasAlreadySent(goal.userId, `streak-warn-${goal._id}`, today)) continue;

      const user = await User.findById(goal.userId).select('name email').lean();
      if (!user) continue;

      // In-app notification
      if (!prefs || prefs.inAppEnabled !== false) {
        await Notification.createNotification({
          recipient: goal.userId,
          type: 'activity-streak-warning',
          title: `⚠️ ${goal.currentStreak}-day streak at risk!`,
          content: `Your "${goal.title}" streak hasn't been completed today. Complete it to keep going!`,
          priority: 'high',
          metadata: { source: 'system', category: 'activity' },
          actionUrl: '/activity'
        });
      }

      await markAsSent(goal.userId, `streak-warn-${goal._id}`, today);
    }
  } catch (error) {
    console.error('[Activity Cron] Streak warning error:', error.message);
  }
}

/**
 * Process weekly summaries (run on Sundays)
 */
const runWeeklySummaries = async () => {
  console.log('[Activity Cron] Starting weekly summary processing...');
  const results = { sent: 0, skipped: 0, errors: 0 };

  try {
    const prefs = await ReminderPreference.find({ weeklySummary: true });
    
    for (const pref of prefs) {
      try {
        const today = getTodayInTimezone(pref.timezone || 'Asia/Kolkata');

        if (await wasAlreadySent(pref.userId, 'weekly', today)) {
          results.skipped++;
          continue;
        }

        const user = await User.findById(pref.userId).select('name email').lean();
        if (!user) continue;

        const summary = await getWeeklySummary(pref.userId, pref.timezone || 'Asia/Kolkata');

        // Only send if there's some activity
        if (summary.goalsCompleted === 0 && summary.coding.activeDays === 0 && summary.learning.activeDays === 0) {
          results.skipped++;
          continue;
        }

        if (pref.emailEnabled !== false) {
          const html = getWeeklyActivitySummaryTemplate(user, summary);
          await sendEmail({
            email: user.email,
            subject: '📊 Your Alumnex Weekly Activity Summary',
            message: html
          });
        }

        if (pref.inAppEnabled !== false) {
          await Notification.createNotification({
            recipient: pref.userId,
            type: 'activity-weekly-summary',
            title: '📊 Weekly Activity Summary',
            content: `This week: ${summary.goalsCompleted} goals completed, ${summary.coding.activeDays}/7 coding days, ${summary.learning.activeDays}/7 learning days.`,
            priority: 'low',
            metadata: { source: 'system', category: 'activity' },
            actionUrl: '/activity'
          });
        }

        await markAsSent(pref.userId, 'weekly', today);
        results.sent++;

        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`[Activity Cron] Weekly summary error for user ${pref.userId}:`, err.message);
        results.errors++;
      }
    }
  } catch (error) {
    console.error('[Activity Cron] Weekly summary critical error:', error);
  }

  console.log(`[Activity Cron] Weekly summary: Sent ${results.sent}, Skipped ${results.skipped}, Errors ${results.errors}`);
  return results;
};

/**
 * Initialize activity reminder cron jobs
 */
const initActivityCron = () => {
  // Daily reminders — run every hour to cover different user timezones
  // The deduplication logic ensures each user only gets one reminder per day
  const dailySchedule = process.env.ACTIVITY_REMINDER_CRON || '0 */2 * * *'; // Every 2 hours
  
  cron.schedule(dailySchedule, async () => {
    console.log(`[Activity CRON] Triggering daily reminders (${dailySchedule})...`);
    await runDailyReminders();
  });

  // Weekly summaries — Sunday at 10 AM
  const weeklySchedule = process.env.ACTIVITY_WEEKLY_CRON || '0 10 * * 0';
  
  cron.schedule(weeklySchedule, async () => {
    console.log(`[Activity CRON] Triggering weekly summaries (${weeklySchedule})...`);
    await runWeeklySummaries();
  });

  console.log(`[Activity CRON] Activity reminders scheduled: "${dailySchedule}" (daily), "${weeklySchedule}" (weekly)`);
};

module.exports = initActivityCron;
module.exports.runDailyReminders = runDailyReminders;
module.exports.runWeeklySummaries = runWeeklySummaries;
