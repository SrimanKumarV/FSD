/**
 * Alumnex Connect — Central Activity Synchronization Orchestrator
 * 
 * Pipeline:
 * External Platform ↓ Remote Activity Fetch ↓ Platform Normalization ↓ 
 * Activity Detection ↓ ActivityRecord Creation/Update ↓ Goal Verification ↓ 
 * Streak Reconciliation ↓ Dashboard Invalidation ↓ Structured Result
 * 
 * Guarantees:
 * - Timezone-aware date calculations
 * - Fresh remote verification before streak decisions
 * - Resilient to temporary platform API outages (never resets streak on 503/timeout)
 * - Historical activity recovery / backfill
 * - Schedule-aware streak reconciliation from durable ActivityRecord truth
 * - Idempotent execution (repeated sync never increments twice)
 */

const DevProfile = require('../models/DevProfile');
const ActivityGoal = require('../models/ActivityGoal');
const ActivityRecord = require('../models/ActivityRecord');
const ReminderPreference = require('../models/ReminderPreference');
const Notification = require('../models/Notification');
const cache = require('../utils/cache');
const {
  getTodayInTimezone,
  formatDateInTimezone,
  getDayOfWeekInTimezone,
  getPreviousDate,
  getNextDate,
  getMidnightProximity
} = require('../utils/timezoneHelper');
const {
  fetchGitHubStats,
  fetchLeetCodeStats,
  fetchHackerRankStats,
  fetchGFGStats,
  fetchCodechefStats,
  fetchCodeforcesStats,
  fetchDuolingoStats
} = require('../utils/devStatsFetcher');

const PLATFORM_FETCHERS = {
  github: fetchGitHubStats,
  leetcode: fetchLeetCodeStats,
  hackerrank: fetchHackerRankStats,
  gfg: fetchGFGStats,
  codechef: fetchCodechefStats,
  codeforces: fetchCodeforcesStats,
  duolingo: fetchDuolingoStats
};

const PLATFORM_INFO = {
  github: { name: 'GitHub', category: 'coding', connectionType: 'api-verified' },
  leetcode: { name: 'LeetCode', category: 'coding', connectionType: 'public-profile' },
  hackerrank: { name: 'HackerRank', category: 'coding', connectionType: 'public-profile' },
  gfg: { name: 'GeeksforGeeks', category: 'coding', connectionType: 'public-profile' },
  codechef: { name: 'CodeChef', category: 'coding', connectionType: 'public-profile' },
  codeforces: { name: 'Codeforces', category: 'coding', connectionType: 'api-verified' },
  duolingo: { name: 'Duolingo', category: 'learning', connectionType: 'public-profile' },
  kaggle: { name: 'Kaggle', category: 'project', connectionType: 'manual' }
};

const MILESTONES = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

/**
 * Check if a specific date is scheduled for a goal
 */
function isDateScheduledForGoal(dateStr, goal, timezone) {
  if (!goal) return false;
  if (goal.frequency === 'daily') return true;
  const d = new Date(dateStr + 'T12:00:00Z');
  const dayOfWeek = getDayOfWeekInTimezone(d, timezone);
  if (goal.frequency === 'weekdays') {
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }
  if (goal.frequency === 'custom') {
    return (goal.customDays || []).includes(dayOfWeek);
  }
  return true;
}

/**
 * Normalizes platform data with explicit timezone awareness
 */
function normalizePlatformDataWithTz(platform, rawStats, username, timezone = 'Asia/Kolkata') {
  const today = getTodayInTimezone(timezone);
  const yesterday = getPreviousDate(today);

  if (!rawStats) {
    return {
      platform,
      username,
      connected: !!username,
      activityToday: false,
      activityYesterday: false,
      activityDates: [],
      syncStatus: username ? 'error' : 'not-connected'
    };
  }

  let activityToday = false;
  let activityYesterday = false;
  const activeDates = new Set();
  let currentStreak = null;
  let longestStreak = null;

  switch (platform) {
    case 'github': {
      currentStreak = rawStats.heatmap?.currentStreak ?? null;
      longestStreak = rawStats.heatmap?.maxStreak ?? null;
      if (Array.isArray(rawStats.heatmap?.points)) {
        for (const pt of rawStats.heatmap.points) {
          if (pt.count > 0 && pt.date) {
            activeDates.add(pt.date);
            if (pt.date === today) activityToday = true;
            if (pt.date === yesterday) activityYesterday = true;
          }
        }
      }
      break;
    }

    case 'leetcode': {
      if (rawStats.calendar) {
        for (const [timestampStr, count] of Object.entries(rawStats.calendar)) {
          if (count > 0) {
            const ts = Number(timestampStr);
            if (!isNaN(ts)) {
              const dStr = formatDateInTimezone(ts * 1000, timezone);
              activeDates.add(dStr);
              if (dStr === today) activityToday = true;
              if (dStr === yesterday) activityYesterday = true;
            }
          }
        }
      }
      break;
    }

    case 'duolingo': {
      currentStreak = rawStats.streak ?? null;
      const streakEndDate = rawStats.streakData?.currentStreak?.endDate;
      if (streakEndDate) {
        activeDates.add(streakEndDate);
        if (streakEndDate === today) activityToday = true;
        if (streakEndDate === yesterday) activityYesterday = true;
      }
      // If user has active streak > 0 and streakEndDate is today in user timezone
      if (rawStats.streak > 0 && streakEndDate === today) {
        activityToday = true;
      }
      break;
    }

    case 'gfg': {
      currentStreak = rawStats.currentStreak ?? null;
      break;
    }

    case 'codeforces': {
      if (Array.isArray(rawStats.ratingHistory) && rawStats.ratingHistory.length > 0) {
        const last = rawStats.ratingHistory[rawStats.ratingHistory.length - 1];
        if (last?.contest?.startTime) {
          const dStr = formatDateInTimezone(last.contest.startTime * 1000, timezone);
          activeDates.add(dStr);
          if (dStr === today) activityToday = true;
          if (dStr === yesterday) activityYesterday = true;
        }
      }
      break;
    }

    default:
      break;
  }

  return {
    platform,
    username,
    connected: true,
    activityToday,
    activityYesterday,
    activeDates: Array.from(activeDates),
    currentStreak,
    longestStreak,
    syncStatus: 'success',
    rawStats
  };
}

/**
 * Reconcile a goal's streak from durable ActivityRecord history
 * Schedule-aware: Respects daily, weekdays, customDays.
 * Unscheduled days never break streaks.
 * 
 * @param {string|ObjectId} goalId
 * @param {string|ObjectId} userId
 * @param {string} timezone
 * @returns {Promise<Object>} Updated goal
 */
async function reconcileGoalStreak(goalId, userId, timezone = 'Asia/Kolkata') {
  const goal = await ActivityGoal.findOne({ _id: goalId, userId });
  if (!goal) return null;

  const today = getTodayInTimezone(timezone);

  // Fetch all completed records for this goal or compatible platform
  const records = await ActivityRecord.find({
    userId,
    $or: [
      { goalId: goal._id, completed: true },
      ...(goal.platform && goal.platform !== 'custom' ? [{ platform: goal.platform, completed: true }] : [])
    ]
  }).select('date createdAt').lean();

  // Check if platform sync is temporarily unavailable / failed (Prompt Section 14 & 15)
  const devProf = await DevProfile.findOne({ user: userId }).select('syncStatus').lean();
  const isTempFailure = devProf && ['temporarily-unavailable', 'failed', 'rate-limited'].includes(devProf.syncStatus);
  if (records.length === 0 && (isTempFailure || (goal.currentStreak > 0 && !goal.lastCompletedAt))) {
    // Preserve existing verified streak history rather than false reset
    return {
      goalId: goal._id,
      title: goal.title,
      currentStreak: goal.currentStreak,
      longestStreak: goal.longestStreak,
      totalCompletions: goal.totalCompletions || 0,
      lastCompletedDate: null,
      syncStatus: isTempFailure ? devProf.syncStatus : 'unverified'
    };
  }

  const completedDateSet = new Set(records.map(r => r.date));
  const sortedDates = Array.from(completedDateSet).sort();

  // 1. Calculate Current Streak
  let currentStreak = 0;
  let evaluateDay = today;

  const isTodayScheduled = isDateScheduledForGoal(today, goal, timezone);
  const isTodayCompleted = completedDateSet.has(today);

  if (isTodayScheduled && isTodayCompleted) {
    // Completed today: evaluate streak starting from today
    evaluateDay = today;
  } else {
    // Today is not completed yet (or not scheduled).
    // Evaluate streak starting from the most recent scheduled day before today.
    let prev = getPreviousDate(today);
    let lookback = 0;
    while (lookback < 14 && !isDateScheduledForGoal(prev, goal, timezone)) {
      prev = getPreviousDate(prev);
      lookback++;
    }
    evaluateDay = prev;
  }

  // Walk backwards day by day to count consecutive completed scheduled days
  let pointer = evaluateDay;
  let consecutiveCheck = true;
  let safetyLimit = 0;

  while (consecutiveCheck && safetyLimit < 730) {
    safetyLimit++;
    const scheduled = isDateScheduledForGoal(pointer, goal, timezone);
    if (scheduled) {
      if (completedDateSet.has(pointer)) {
        currentStreak++;
      } else {
        // Scheduled day missed! Streak stops here.
        consecutiveCheck = false;
        break;
      }
    }
    // Unscheduled days are skipped without breaking streak
    pointer = getPreviousDate(pointer);
  }

  // 2. Calculate Longest Streak Across History
  let longestStreak = currentStreak;
  if (sortedDates.length > 0) {
    let running = 0;
    let scanDate = sortedDates[0];
    const latestDate = sortedDates[sortedDates.length - 1];
    let scanLimit = 0;

    while (scanDate <= latestDate && scanLimit < 1000) {
      scanLimit++;
      const scheduled = isDateScheduledForGoal(scanDate, goal, timezone);
      if (scheduled) {
        if (completedDateSet.has(scanDate)) {
          running++;
          if (running > longestStreak) longestStreak = running;
        } else {
          running = 0;
        }
      }
      scanDate = getNextDate(scanDate);
    }
  }

  // 3. Last Completed Date
  const lastRecordDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null;

  // If temporary platform outage occurred, do not downgrade streak to lower value
  if (isTempFailure && (goal.currentStreak || 0) > currentStreak) {
    currentStreak = goal.currentStreak;
    longestStreak = Math.max(longestStreak, goal.longestStreak || 0);
  }

  goal.currentStreak = currentStreak;
  goal.longestStreak = Math.max(goal.longestStreak || 0, longestStreak);
  goal.totalCompletions = completedDateSet.size;
  if (lastRecordDate) {
    goal.lastCompletedAt = new Date(lastRecordDate + 'T12:00:00Z');
  }
  await goal.save();

  return {
    goalId: goal._id,
    title: goal.title,
    currentStreak,
    longestStreak: goal.longestStreak,
    totalCompletions: goal.totalCompletions,
    lastCompletedDate: lastRecordDate
  };
}

/**
 * Central Activity Intelligence Synchronizer
 * 
 * @param {string|ObjectId} userId
 * @param {Object} options
 * @param {string} [options.timezone] - User's local timezone
 * @param {boolean} [options.forceRemote=false] - Force remote API fetch
 * @param {string} [options.reason='manual-sync'] - Trigger reason
 * @param {Array<string>} [options.platforms] - Specific platforms to sync
 * @param {boolean} [options.onlyAtRisk=false] - Only sync if user has active streaks at risk
 * @param {boolean} [options.preDeadline=false] - Pre-midnight protection run
 */
async function syncUserActivityIntelligence(userId, options = {}) {
  const startTime = Date.now();
  const reason = options.reason || 'manual-sync';

  // 1. Resolve Timezone
  let timezone = options.timezone;
  let prefs = null;
  if (!timezone) {
    prefs = await ReminderPreference.findOne({ userId }).lean();
    timezone = prefs?.timezone || 'Asia/Kolkata';
  }

  const today = getTodayInTimezone(timezone);
  const yesterday = getPreviousDate(today);

  // 2. Fetch DevProfile
  let devProfile = await DevProfile.findOne({ user: userId });
  if (!devProfile) {
    return {
      success: true,
      synced: 0,
      activitiesDetected: [],
      goalsVerified: [],
      streaksReconciled: [],
      syncStatus: 'no-profile',
      message: 'No connected developer profile found'
    };
  }

  // 3. Freshness Check for Non-Forced Syncs
  // If recent sync succeeded within 5 minutes and not forced, reuse existing fresh stats
  const lastSyncTime = devProfile.lastRemoteSyncAt ? new Date(devProfile.lastRemoteSyncAt).getTime() : 0;
  const isVeryRecent = Date.now() - lastSyncTime < 5 * 60 * 1000;
  const shouldFetchRemote = options.forceRemote || !isVeryRecent || reason === 'pre-reminder' || reason === 'pre-midnight';

  const platformResults = {};
  let anyPlatformSucceeded = false;
  let anyPlatformFailed = false;

  // 4. Remote Platform Fetch
  if (shouldFetchRemote && devProfile.usernames) {
    for (const [platform, uData] of Object.entries(devProfile.usernames)) {
      if (options.platforms && !options.platforms.includes(platform)) continue;
      const username = uData?.username;
      const fetcher = PLATFORM_FETCHERS[platform];

      if (username && fetcher) {
        try {
          const rawStats = await fetcher(username);
          if (rawStats) {
            if (!devProfile.stats) devProfile.stats = {};
            devProfile.stats[platform] = rawStats;
            platformResults[platform] = { success: true };
            anyPlatformSucceeded = true;
          } else {
            platformResults[platform] = { success: false, reason: 'empty_response' };
            anyPlatformFailed = true;
          }
        } catch (fetchErr) {
          console.warn(`[ActivityOrchestrator] Platform fetch failed for ${platform} (${username}):`, fetchErr.message);
          platformResults[platform] = { success: false, error: fetchErr.message };
          anyPlatformFailed = true;
        }
      }
    }

    devProfile.lastSyncAttemptAt = new Date();
    if (anyPlatformSucceeded) {
      devProfile.lastSuccessfulRemoteSyncAt = new Date();
      devProfile.lastRemoteSyncAt = new Date();
      devProfile.syncStatus = anyPlatformFailed ? 'partial' : 'success';
    } else if (anyPlatformFailed) {
      devProfile.syncStatus = 'temporarily-unavailable';
    }
    devProfile.markModified('stats');
    await devProfile.save();
  }

  if (!devProfile.stats) {
    return {
      success: true,
      synced: 0,
      activitiesDetected: [],
      goalsVerified: [],
      streaksReconciled: [],
      syncStatus: devProfile.syncStatus || 'no-stats'
    };
  }

  // 5. Normalization, Activity Detection, and Historical Recovery
  const detectedActivities = [];
  const goalsVerified = [];
  const recoveredRecords = [];

  for (const [platform, stats] of Object.entries(devProfile.stats)) {
    if (!stats || stats.fetchError) continue;
    const username = devProfile.usernames?.[platform]?.username;
    const normalized = normalizePlatformDataWithTz(platform, stats, username, timezone);

    // ── TODAY'S ACTIVITY ──
    if (normalized.activityToday) {
      detectedActivities.push({
        platform,
        category: PLATFORM_INFO[platform]?.category || 'coding',
        title: `${PLATFORM_INFO[platform]?.name || platform} Activity Verified`,
        completionType: PLATFORM_INFO[platform]?.connectionType === 'api-verified' ? 'api-verified' : 'auto-detected'
      });

      // Ensure general platform ActivityRecord exists for today (idempotent)
      const existingTodayPlatformRecord = await ActivityRecord.findOne({
        userId,
        platform,
        date: today,
        goalId: null
      });

      if (!existingTodayPlatformRecord) {
        try {
          await ActivityRecord.create({
            userId,
            platform,
            category: PLATFORM_INFO[platform]?.category || 'coding',
            title: `${PLATFORM_INFO[platform]?.name || platform} Activity Detected`,
            sourceTitle: `${PLATFORM_INFO[platform]?.name || platform} platform activity`,
            sourceId: `${platform}-${today}`,
            date: today,
            completed: true,
            completionType: PLATFORM_INFO[platform]?.connectionType === 'api-verified' ? 'api-verified' : 'auto-detected',
            metadata: { platform, autoDetected: true }
          });
        } catch (recErr) {
          if (recErr.code !== 11000) console.warn('[ActivityOrchestrator] Platform record error:', recErr.message);
        }
      }

      // Match and auto-complete compatible user goals
      // Precise matching: Goal must explicitly specify this platform OR
      // match category IF trackingMode is automatic or hybrid
      const matchingGoals = await ActivityGoal.find({
        userId,
        enabled: true,
        $or: [
          { platform },
          { category: PLATFORM_INFO[platform]?.category || 'coding', trackingMode: { $in: ['automatic', 'hybrid'] } }
        ]
      });

      for (const goal of matchingGoals) {
        let goalRecord = await ActivityRecord.findOne({ userId, goalId: goal._id, date: today });
        const alreadyCompleted = goalRecord && goalRecord.completed;

        if (!alreadyCompleted) {
          if (!goalRecord) {
            goalRecord = new ActivityRecord({
              userId,
              goalId: goal._id,
              platform: goal.platform || platform,
              category: goal.category || 'coding',
              title: goal.title,
              sourceTitle: `${PLATFORM_INFO[platform]?.name || platform} Activity Verified`,
              date: today,
              completed: true,
              completionType: 'api-verified',
              metadata: { externalPlatform: platform, verifiedAt: new Date() }
            });
          } else {
            goalRecord.completed = true;
            goalRecord.completionType = 'api-verified';
          }

          try {
            await goalRecord.save();
            goalsVerified.push({ goalId: goal._id, title: goal.title, platform });
          } catch (goalSaveErr) {
            if (goalSaveErr.code !== 11000) {
              console.warn('[ActivityOrchestrator] Goal record save warning:', goalSaveErr.message);
            }
          }
        }
      }
    }

    // ── HISTORICAL RECOVERY / BACKFILL (Phase 6 & 13) ──
    // For platforms providing verified historical evidence (e.g. GitHub heatmap, LeetCode calendar, Duolingo streak)
    if (Array.isArray(normalized.activeDates) && normalized.activeDates.length > 0) {
      // Check yesterday and recent dates (up to last 14 days)
      const checkDates = [yesterday];
      let pDate = yesterday;
      for (let i = 0; i < 6; i++) {
        pDate = getPreviousDate(pDate);
        checkDates.push(pDate);
      }

      for (const dStr of checkDates) {
        if (normalized.activeDates.includes(dStr)) {
          // Check if an ActivityRecord exists for this date
          const existingHistoricalRecord = await ActivityRecord.findOne({
            userId,
            platform,
            date: dStr
          });

          if (!existingHistoricalRecord) {
            try {
              const backfilled = await ActivityRecord.create({
                userId,
                platform,
                category: PLATFORM_INFO[platform]?.category || 'coding',
                title: `${PLATFORM_INFO[platform]?.name || platform} Verified Activity`,
                sourceTitle: `${PLATFORM_INFO[platform]?.name || platform} historical evidence`,
                sourceId: `${platform}-${dStr}-recovered`,
                date: dStr,
                completed: true,
                completionType: 'api-verified',
                metadata: {
                  autoRecovered: true,
                  externalPlatform: platform,
                  recoveredAt: new Date(),
                  reason: 'historical_reconciliation'
                }
              });
              recoveredRecords.push({ date: dStr, platform });

              // Also backfill compatible automatic goals for that date
              const compatibleGoals = await ActivityGoal.find({
                userId,
                enabled: true,
                $or: [
                  { platform },
                  { category: PLATFORM_INFO[platform]?.category || 'coding', trackingMode: { $in: ['automatic', 'hybrid'] } }
                ]
              });

              for (const cg of compatibleGoals) {
                if (isDateScheduledForGoal(dStr, cg, timezone)) {
                  await ActivityRecord.findOneAndUpdate(
                    { userId, goalId: cg._id, date: dStr },
                    {
                      $set: {
                        userId,
                        goalId: cg._id,
                        platform: cg.platform || platform,
                        category: cg.category || 'coding',
                        title: cg.title,
                        sourceTitle: `${PLATFORM_INFO[platform]?.name || platform} Recovered Activity`,
                        date: dStr,
                        completed: true,
                        completionType: 'api-verified',
                        metadata: { autoRecovered: true, externalPlatform: platform }
                      }
                    },
                    { upsert: true, setDefaultsOnInsert: true }
                  ).catch(() => {});
                }
              }
            } catch (backfillErr) {
              if (backfillErr.code !== 11000) {
                console.warn('[ActivityOrchestrator] Historical backfill warning:', backfillErr.message);
              }
            }
          }
        }
      }
    }
  }

  // 6. Streak Reconciliation (Durable Truth: ActivityRecord)
  const userGoals = await ActivityGoal.find({ userId, enabled: true });
  const streaksReconciled = [];

  for (const goal of userGoals) {
    const reconciled = await reconcileGoalStreak(goal._id, userId, timezone);
    if (reconciled) {
      streaksReconciled.push(reconciled);

      // Milestone notification check
      if (MILESTONES.includes(reconciled.currentStreak)) {
        await Notification.createOrClaimNotification({
          recipient: userId,
          type: 'activity-milestone',
          title: `🏆 ${reconciled.currentStreak}-Day Streak Milestone!`,
          content: `Incredible! "${reconciled.title}" verified for a ${reconciled.currentStreak}-day streak.`,
          priority: 'normal',
          metadata: { source: 'system', category: 'activity' },
          actionUrl: '/activity',
          dedupKey: `milestone:${userId}:${goal._id}:${reconciled.currentStreak}`
        }).catch(e => console.warn('[ActivityOrchestrator] Milestone notif warning:', e.message));
      }
    }
  }

  // 7. Invalidate Caches
  await cache.del(`activity:dashboard:${userId}`);
  await cache.del(`activity:integrations:${userId}`);

  const duration = Date.now() - startTime;
  console.log(`[ActivityOrchestrator] Synced user ${userId} in ${duration}ms (reason: ${reason}, detected: ${detectedActivities.length}, verified: ${goalsVerified.length}, recovered: ${recoveredRecords.length})`);

  return {
    success: true,
    timezone,
    today,
    synced: Object.keys(devProfile.stats || {}).length,
    activitiesDetected: detectedActivities,
    goalsVerified,
    recoveredRecords,
    streaksReconciled,
    lastRemoteSyncAt: devProfile.lastRemoteSyncAt || new Date(),
    syncStatus: devProfile.syncStatus || 'success'
  };
}

/**
 * Historical platform activity recovery (Phases 6 & 13)
 */
async function backfillHistoricalPlatformActivity(userId, platform, rawStats, timezone = 'Asia/Kolkata') {
  const normalized = normalizePlatformDataWithTz(platform, rawStats, '', timezone);
  const recoveredRecords = [];
  if (!Array.isArray(normalized.activeDates) || normalized.activeDates.length === 0) {
    return 0;
  }
  const today = getTodayInTimezone(timezone);
  const yesterday = getPreviousDate(today);
  const checkDates = [today, yesterday];
  let pDate = yesterday;
  for (let i = 0; i < 6; i++) {
    pDate = getPreviousDate(pDate);
    checkDates.push(pDate);
  }

  for (const dStr of checkDates) {
    if (normalized.activeDates.includes(dStr)) {
      const existing = await ActivityRecord.findOne({ userId, platform, date: dStr });
      if (!existing) {
        try {
          await ActivityRecord.create({
            userId,
            platform,
            category: PLATFORM_INFO[platform]?.category || 'coding',
            title: `${PLATFORM_INFO[platform]?.name || platform} Verified Activity`,
            sourceTitle: `${PLATFORM_INFO[platform]?.name || platform} historical evidence`,
            sourceId: `${platform}-${dStr}-recovered`,
            date: dStr,
            completed: true,
            completionType: 'api-verified',
            metadata: {
              autoRecovered: true,
              externalPlatform: platform,
              recoveredAt: new Date(),
              reason: 'historical_reconciliation'
            }
          });
          recoveredRecords.push(dStr);
        } catch (err) {
          if (err.code !== 11000) console.warn('[ActivityOrchestrator] Backfill error:', err.message);
        }
      }
    }
  }
  return recoveredRecords.length;
}

module.exports = {
  syncUserActivityIntelligence,
  reconcileGoalStreak,
  backfillHistoricalPlatformActivity,
  normalizePlatformDataWithTz,
  isDateScheduledForGoal,
  PLATFORM_INFO,
  PLATFORM_FETCHERS,
  MILESTONES
};
