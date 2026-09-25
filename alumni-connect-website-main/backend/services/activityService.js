const DevProfile = require('../models/DevProfile');
const ActivityGoal = require('../models/ActivityGoal');
const ActivityRecord = require('../models/ActivityRecord');
const cache = require('../utils/cache');
const {
  fetchGitHubStats,
  fetchLeetCodeStats,
  fetchHackerRankStats,
  fetchGFGStats,
  fetchCodechefStats,
  fetchCodeforcesStats,
  fetchDuolingoStats
} = require('../utils/devStatsFetcher');

// Map platform names to their fetcher functions
const PLATFORM_FETCHERS = {
  github: fetchGitHubStats,
  leetcode: fetchLeetCodeStats,
  hackerrank: fetchHackerRankStats,
  gfg: fetchGFGStats,
  codechef: fetchCodechefStats,
  codeforces: fetchCodeforcesStats,
  duolingo: fetchDuolingoStats
};

// Platform metadata for the frontend
const PLATFORM_INFO = {
  github: {
    name: 'GitHub',
    icon: '💻',
    color: '#24292e',
    connectionType: 'api-verified',
    streakReliable: true,
    profileBaseUrl: 'https://github.com/'
  },
  leetcode: {
    name: 'LeetCode',
    icon: '🔥',
    color: '#f89f1b',
    connectionType: 'public-profile',
    streakReliable: false, // Calendar available but not an official streak
    profileBaseUrl: 'https://leetcode.com/'
  },
  hackerrank: {
    name: 'HackerRank',
    icon: '🏅',
    color: '#2ec866',
    connectionType: 'public-profile',
    streakReliable: false,
    profileBaseUrl: 'https://www.hackerrank.com/profile/'
  },
  gfg: {
    name: 'GeeksforGeeks',
    icon: '📗',
    color: '#2f8d46',
    connectionType: 'public-profile',
    streakReliable: false,
    profileBaseUrl: 'https://www.geeksforgeeks.org/user/'
  },
  codechef: {
    name: 'CodeChef',
    icon: '👨‍🍳',
    color: '#5b4638',
    connectionType: 'public-profile',
    streakReliable: false,
    profileBaseUrl: 'https://www.codechef.com/users/'
  },
  codeforces: {
    name: 'Codeforces',
    icon: '⚡',
    color: '#1f8acb',
    connectionType: 'api-verified',
    streakReliable: false,
    profileBaseUrl: 'https://codeforces.com/profile/'
  },
  duolingo: {
    name: 'Duolingo',
    icon: '🌍',
    color: '#58cc02',
    connectionType: 'public-profile',
    streakReliable: true,
    profileBaseUrl: 'https://www.duolingo.com/profile/'
  },
  kaggle: {
    name: 'Kaggle',
    icon: '📊',
    color: '#20beff',
    connectionType: 'manual',
    streakReliable: false,
    profileBaseUrl: 'https://www.kaggle.com/'
  }
};

/**
 * Normalize raw platform stats into a unified structure
 */
function normalizePlatformData(platform, rawStats, username) {
  if (!rawStats) {
    return {
      platform,
      username,
      connected: !!username,
      connectionType: username ? PLATFORM_INFO[platform]?.connectionType || 'manual' : 'none',
      lastActivityAt: null,
      currentStreak: null,
      longestStreak: null,
      activityToday: false,
      activityAvailable: false,
      lastCheckedAt: new Date(),
      status: username ? 'error' : 'not-connected',
      error: username ? 'Unable to fetch data' : null,
      profileUrl: username ? (PLATFORM_INFO[platform]?.profileBaseUrl || '') + username : null,
      details: null
    };
  }

  const today = new Date().toISOString().split('T')[0];
  let currentStreak = null;
  let longestStreak = null;
  let activityToday = false;
  let lastActivityAt = null;

  switch (platform) {
    case 'github': {
      currentStreak = rawStats.heatmap?.currentStreak ?? null;
      longestStreak = rawStats.heatmap?.maxStreak ?? null;
      const todayPoints = rawStats.heatmap?.points?.find(p => p.date === today);
      activityToday = todayPoints ? todayPoints.count > 0 : false;
      const lastPoint = rawStats.heatmap?.points?.slice(-1)[0];
      lastActivityAt = lastPoint ? new Date(lastPoint.date) : null;
      break;
    }
    case 'leetcode': {
      // LeetCode calendar is a Unix timestamp -> count map
      if (rawStats.calendar) {
        const todayTs = Math.floor(new Date(today).getTime() / 1000);
        // Check today's submissions (timestamps are midnight UTC of each day)
        const todayStart = todayTs - (todayTs % 86400);
        activityToday = rawStats.calendar[todayStart.toString()] > 0;
        // Compute streak from calendar
        const calendarDays = Object.keys(rawStats.calendar)
          .map(Number)
          .filter(ts => rawStats.calendar[ts] > 0)
          .sort((a, b) => b - a); // descending
        if (calendarDays.length > 0) {
          lastActivityAt = new Date(calendarDays[0] * 1000);
        }
      }
      // LeetCode does not expose an official streak — mark as unreliable
      currentStreak = null;
      longestStreak = null;
      break;
    }
    case 'duolingo': {
      currentStreak = rawStats.streak ?? null;
      activityToday = rawStats.streakData?.currentStreak?.endDate === today;
      lastActivityAt = rawStats.streakData?.currentStreak?.endDate
        ? new Date(rawStats.streakData.currentStreak.endDate)
        : null;
      break;
    }
    case 'hackerrank': {
      lastActivityAt = null; // No last-activity info
      break;
    }
    case 'gfg': {
      currentStreak = rawStats.currentStreak ?? null;
      break;
    }
    case 'codeforces': {
      lastActivityAt = null;
      if (rawStats.ratingHistory && rawStats.ratingHistory.length > 0) {
        const lastContest = rawStats.ratingHistory[rawStats.ratingHistory.length - 1];
        lastActivityAt = lastContest?.contest?.startTime
          ? new Date(lastContest.contest.startTime * 1000)
          : null;
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
    connectionType: PLATFORM_INFO[platform]?.connectionType || 'public-profile',
    lastActivityAt,
    currentStreak,
    longestStreak,
    activityToday,
    activityAvailable: true,
    lastCheckedAt: new Date(),
    status: 'connected',
    error: null,
    profileUrl: rawStats.url || (PLATFORM_INFO[platform]?.profileBaseUrl || '') + username,
    details: rawStats
  };
}

/**
 * Get all integrations for a user with normalized data.
 * Uses DevProfile usernames and cached stats.
 */
async function getUserIntegrations(userId) {
  const cacheKey = `activity:integrations:${userId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const devProfile = await DevProfile.findOne({ user: userId });
  if (!devProfile) {
    return { platforms: [], connected: 0, total: Object.keys(PLATFORM_INFO).length };
  }

  const platforms = [];
  for (const [platform, info] of Object.entries(PLATFORM_INFO)) {
    const usernameData = devProfile.usernames?.[platform];
    const username = usernameData?.username || '';
    const stats = devProfile.stats?.[platform] || null;

    if (username) {
      platforms.push({
        ...normalizePlatformData(platform, stats, username),
        info: {
          name: info.name,
          icon: info.icon,
          color: info.color,
          streakReliable: info.streakReliable
        }
      });
    }
  }

  const result = {
    platforms,
    connected: platforms.filter(p => p.status === 'connected').length,
    total: Object.keys(PLATFORM_INFO).length
  };

  // Cache for 10 minutes — stats are refreshed by the cron worker
  await cache.set(cacheKey, result, 600);
  return result;
}

/**
 * Refresh activity data for a specific platform for a user.
 */
async function refreshPlatformData(userId, platform) {
  const fetcher = PLATFORM_FETCHERS[platform];
  if (!fetcher) return null;

  const devProfile = await DevProfile.findOne({ user: userId });
  if (!devProfile) return null;

  const username = devProfile.usernames?.[platform]?.username;
  if (!username) return null;

  try {
    const rawStats = await fetcher(username);
    if (rawStats) {
      devProfile.stats[platform] = rawStats;
      devProfile.lastUpdated = new Date();
      devProfile.markModified('stats');
      await devProfile.save();
    }

    // Invalidate cache
    await cache.del(`activity:integrations:${userId}`);
    await cache.del(`activity:dashboard:${userId}`);

    return normalizePlatformData(platform, rawStats, username);
  } catch (error) {
    console.error(`[ActivityService] Failed to refresh ${platform} for user ${userId}:`, error.message);
    return normalizePlatformData(platform, null, username);
  }
}

/**
 * Get today's date string in a given timezone
 */
function getTodayInTimezone(timezone = 'Asia/Kolkata') {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).formatToParts(now);
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Get the dashboard summary for a user
 */
async function getDashboardSummary(userId, timezone = 'Asia/Kolkata') {
  const cacheKey = `activity:dashboard:${userId}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const today = getTodayInTimezone(timezone);

  // Fetch goals and today's records in parallel
  const [goals, todayRecords, integrations] = await Promise.all([
    ActivityGoal.find({ userId, enabled: true }).lean(),
    ActivityRecord.find({ userId, date: today }).lean(),
    getUserIntegrations(userId)
  ]);

  // Compute completion status per goal
  const completedGoalIds = new Set(
    todayRecords.filter(r => r.completed).map(r => r.goalId?.toString())
  );

  const todaysGoals = goals.map(goal => ({
    ...goal,
    completedToday: completedGoalIds.has(goal._id.toString())
  }));

  const completedCount = todaysGoals.filter(g => g.completedToday).length;

  // Compute overall streak (max of all goal streaks)
  const maxStreak = goals.reduce((max, g) => Math.max(max, g.currentStreak || 0), 0);
  const longestStreak = goals.reduce((max, g) => Math.max(max, g.longestStreak || 0), 0);

  // Compute coding vs learning breakdown
  const codingGoals = todaysGoals.filter(g =>
    g.category === 'coding' || ['leetcode', 'github', 'hackerrank', 'codechef', 'codeforces', 'gfg'].includes(g.platform)
  );
  const learningGoals = todaysGoals.filter(g =>
    g.category === 'learning' || ['duolingo'].includes(g.platform)
  );

  const summary = {
    today,
    currentStreak: maxStreak,
    longestStreak,
    todaysGoals: {
      total: todaysGoals.length,
      completed: completedCount,
      goals: todaysGoals
    },
    coding: {
      total: codingGoals.length,
      completed: codingGoals.filter(g => g.completedToday).length
    },
    learning: {
      total: learningGoals.length,
      completed: learningGoals.filter(g => g.completedToday).length
    },
    integrations
  };

  // Cache for 5 minutes
  await cache.set(cacheKey, summary, 300);
  return summary;
}

/**
 * Mark a goal as completed for today and update streak
 */
async function completeGoal(userId, goalId, timezone = 'Asia/Kolkata') {
  const today = getTodayInTimezone(timezone);
  const goal = await ActivityGoal.findOne({ _id: goalId, userId });
  if (!goal) throw new Error('Goal not found');

  // Create or update the record
  let record = await ActivityRecord.findOne({ userId, goalId, date: today });
  if (record && record.completed) {
    return { alreadyCompleted: true, record, goal };
  }

  if (!record) {
    record = new ActivityRecord({
      userId,
      goalId,
      platform: goal.platform,
      date: today,
      completed: true,
      completionType: 'manual'
    });
  } else {
    record.completed = true;
    record.completionType = 'manual';
  }
  await record.save();

  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getTodayInTimezone(timezone);

  const lastCompletedDate = goal.lastCompletedAt
    ? getTodayInTimezone(timezone) // Simplified: just check if it was yesterday
    : null;

  // If the user completed yesterday (or this is their first), increment streak
  if (!goal.lastCompletedAt || isConsecutiveDay(goal.lastCompletedAt, timezone)) {
    goal.currentStreak = (goal.currentStreak || 0) + 1;
  } else {
    goal.currentStreak = 1; // Reset streak
  }

  goal.longestStreak = Math.max(goal.longestStreak || 0, goal.currentStreak);
  goal.lastCompletedAt = new Date();
  goal.totalCompletions = (goal.totalCompletions || 0) + 1;
  await goal.save();

  // Invalidate cache
  await cache.del(`activity:dashboard:${userId}`);

  return { alreadyCompleted: false, record, goal };
}

/**
 * Check if the last completion was yesterday (consecutive day)
 */
function isConsecutiveDay(lastDate, timezone = 'Asia/Kolkata') {
  if (!lastDate) return false;
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastStr = formatDateInTimezone(lastDate, timezone);
  const todayStr = getTodayInTimezone(timezone);
  const yesterdayStr = formatDateInTimezone(yesterday, timezone);

  return lastStr === yesterdayStr || lastStr === todayStr;
}

function formatDateInTimezone(date, timezone = 'Asia/Kolkata') {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).formatToParts(new Date(date));
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    return `${year}-${month}-${day}`;
  } catch {
    return new Date(date).toISOString().split('T')[0];
  }
}

/**
 * Get weekly summary data for a user
 */
async function getWeeklySummary(userId, timezone = 'Asia/Kolkata') {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(formatDateInTimezone(d, timezone));
  }

  const [records, goals] = await Promise.all([
    ActivityRecord.find({
      userId,
      date: { $in: dates },
      completed: true
    }).lean(),
    ActivityGoal.find({ userId, enabled: true }).lean()
  ]);

  // Days with any coding activity
  const codingDays = new Set(
    records
      .filter(r => {
        const goal = goals.find(g => g._id.toString() === r.goalId?.toString());
        return goal && (goal.category === 'coding' || ['leetcode', 'github', 'hackerrank', 'codechef', 'codeforces', 'gfg'].includes(goal.platform));
      })
      .map(r => r.date)
  );

  const learningDays = new Set(
    records
      .filter(r => {
        const goal = goals.find(g => g._id.toString() === r.goalId?.toString());
        return goal && (goal.category === 'learning' || ['duolingo'].includes(goal.platform));
      })
      .map(r => r.date)
  );

  return {
    period: { start: dates[0], end: dates[dates.length - 1] },
    coding: { activeDays: codingDays.size, totalDays: 7 },
    learning: { activeDays: learningDays.size, totalDays: 7 },
    goalsCompleted: records.length,
    longestStreak: goals.reduce((max, g) => Math.max(max, g.longestStreak || 0), 0)
  };
}

module.exports = {
  PLATFORM_INFO,
  PLATFORM_FETCHERS,
  getUserIntegrations,
  refreshPlatformData,
  getDashboardSummary,
  completeGoal,
  getWeeklySummary,
  getTodayInTimezone,
  formatDateInTimezone,
  normalizePlatformData
};
