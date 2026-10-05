const DevProfile = require('../models/DevProfile');
const ActivityGoal = require('../models/ActivityGoal');
const ActivityRecord = require('../models/ActivityRecord');
const Notification = require('../models/Notification');
const cache = require('../utils/cache');
const calendarSyncService = require('./calendarSyncService');
const {
  getTodayInTimezone,
  formatDateInTimezone,
  getDayOfWeekInTimezone,
  getPreviousDate,
  getNextDate,
  isConsecutiveDay,
  getLocalTimeInfo,
  getMidnightProximity,
  isQuietHours,
  isReminderDay
} = require('../utils/timezoneHelper');
const {
  syncUserActivityIntelligence,
  reconcileGoalStreak
} = require('./activitySyncOrchestrator');
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
    category: 'coding',
    connectionType: 'api-verified',
    streakReliable: true,
    profileBaseUrl: 'https://github.com/'
  },
  leetcode: {
    name: 'LeetCode',
    icon: '🔥',
    color: '#f89f1b',
    category: 'coding',
    connectionType: 'public-profile',
    streakReliable: false,
    profileBaseUrl: 'https://leetcode.com/'
  },
  hackerrank: {
    name: 'HackerRank',
    icon: '🏅',
    color: '#2ec866',
    category: 'coding',
    connectionType: 'public-profile',
    streakReliable: false,
    profileBaseUrl: 'https://www.hackerrank.com/profile/'
  },
  gfg: {
    name: 'GeeksforGeeks',
    icon: '📗',
    color: '#2f8d46',
    category: 'coding',
    connectionType: 'public-profile',
    streakReliable: false,
    profileBaseUrl: 'https://www.geeksforgeeks.org/user/'
  },
  codechef: {
    name: 'CodeChef',
    icon: '👨‍🍳',
    color: '#5b4638',
    category: 'coding',
    connectionType: 'public-profile',
    streakReliable: false,
    profileBaseUrl: 'https://www.codechef.com/users/'
  },
  codeforces: {
    name: 'Codeforces',
    icon: '⚡',
    color: '#1f8acb',
    category: 'coding',
    connectionType: 'api-verified',
    streakReliable: false,
    profileBaseUrl: 'https://codeforces.com/profile/'
  },
  duolingo: {
    name: 'Duolingo',
    icon: '🌍',
    color: '#58cc02',
    category: 'learning',
    connectionType: 'public-profile',
    streakReliable: true,
    profileBaseUrl: 'https://www.duolingo.com/profile/'
  },
  kaggle: {
    name: 'Kaggle',
    icon: '📊',
    color: '#20beff',
    category: 'project',
    connectionType: 'manual',
    streakReliable: false,
    profileBaseUrl: 'https://www.kaggle.com/'
  }
};

const MILESTONES = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

// ─── PLATFORM DATA NORMALIZATION ────────────────────────────────

function normalizePlatformData(platform, rawStats, username, timezone = 'Asia/Kolkata') {
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

  const today = getTodayInTimezone(timezone);
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
      if (rawStats.calendar) {
        // Timezone-aware timestamp check:
        for (const [timestampStr, count] of Object.entries(rawStats.calendar)) {
          if (count > 0) {
            const ts = Number(timestampStr);
            if (!isNaN(ts) && formatDateInTimezone(ts * 1000, timezone) === today) {
              activityToday = true;
              break;
            }
          }
        }
        const calendarDays = Object.keys(rawStats.calendar)
          .map(Number)
          .filter(ts => rawStats.calendar[ts] > 0)
          .sort((a, b) => b - a);
        if (calendarDays.length > 0) {
          lastActivityAt = new Date(calendarDays[0] * 1000);
        }
      }
      currentStreak = null;
      longestStreak = null;
      break;
    }
    case 'duolingo': {
      currentStreak = rawStats.streak ?? null;
      const duoEndDate = rawStats.streakData?.currentStreak?.endDate;
      activityToday = duoEndDate === today;
      lastActivityAt = duoEndDate ? new Date(duoEndDate) : null;
      break;
    }
    case 'hackerrank': {
      lastActivityAt = null;
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
          category: info.category,
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

  await cache.set(cacheKey, result, 600);
  return result;
}

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
      if (!devProfile.stats) devProfile.stats = {};
      devProfile.stats[platform] = rawStats;
      devProfile.lastUpdated = new Date();
      devProfile.markModified('stats');
      await devProfile.save();
    }

    // Invalidate caches
    await cache.del(`activity:integrations:${userId}`);
    await cache.del(`activity:dashboard:${userId}`);

    // Automatically check and record activity for today if found
    await syncUserPlatformActivities(userId);

    return normalizePlatformData(platform, rawStats, username);
  } catch (error) {
    console.error(`[ActivityService] Failed to refresh ${platform} for user ${userId}:`, error.message);
    return normalizePlatformData(platform, null, username);
  }
}

// ─── AUTOMATED PLATFORM SYNC & GOAL VERIFICATION ────────────────

async function syncUserPlatformActivities(userId, timezone = 'Asia/Kolkata', refreshRemote = false) {
  return syncUserActivityIntelligence(userId, {
    timezone,
    forceRemote: refreshRemote,
    reason: 'activity-service-sync'
  });
}

// ─── STREAK ENGINE (OVERALL, CATEGORY, GOAL) ────────────────────

async function calculateOverallStreak(userId, timezone = 'Asia/Kolkata') {
  const today = getTodayInTimezone(timezone);
  const yesterday = getPreviousDate(today);

  // Query all distinct dates with completed activities
  const records = await ActivityRecord.find({ userId, completed: true }).select('date').lean();
  const dateSet = new Set(records.map(r => r.date));

  const activeToday = dateSet.has(today);
  const activeYesterday = dateSet.has(yesterday);

  let currentStreak = 0;
  let startDate = null;

  if (activeToday) {
    let d = today;
    while (dateSet.has(d)) {
      currentStreak++;
      startDate = d;
      d = getPreviousDate(d);
    }
  } else if (activeYesterday) {
    let d = yesterday;
    while (dateSet.has(d)) {
      currentStreak++;
      startDate = d;
      d = getPreviousDate(d);
    }
  }

  // Longest streak across all recorded history
  const allDates = Array.from(dateSet).sort();
  let longestStreak = 0;
  let running = 0;

  for (let i = 0; i < allDates.length; i++) {
    if (i === 0) {
      running = 1;
    } else {
      const prev = allDates[i - 1];
      if (allDates[i] === getNextDate(prev)) {
        running++;
      } else {
        running = 1;
      }
    }
    if (running > longestStreak) longestStreak = running;
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  // Milestone intelligence
  const achieved = MILESTONES.filter(m => m <= currentStreak);
  const next = MILESTONES.find(m => m > currentStreak) || null;
  const daysRemaining = next ? next - currentStreak : 0;
  const prevMilestone = achieved.length > 0 ? achieved[achieved.length - 1] : 0;
  const progressToNext = next ? Math.round(((currentStreak - prevMilestone) / (next - prevMilestone)) * 100) : 100;

  // At risk if streak is active (>0) but no activity has been completed today
  const atRisk = currentStreak > 0 && !activeToday;

  return {
    current: currentStreak,
    longest: longestStreak,
    activeToday,
    atRisk,
    startDate,
    lastActiveDate: activeToday ? today : (activeYesterday ? yesterday : (allDates.length > 0 ? allDates[allDates.length - 1] : null)),
    totalActiveDays: dateSet.size,
    milestones: {
      achieved,
      next,
      daysRemaining,
      progressToNext,
      all: MILESTONES
    }
  };
}

async function calculateCategoryStreaks(userId, timezone = 'Asia/Kolkata') {
  const today = getTodayInTimezone(timezone);
  const yesterday = getPreviousDate(today);

  const categories = ['coding', 'learning', 'project', 'career'];
  const results = {};

  const records = await ActivityRecord.find({ userId, completed: true }).select('date category platform').lean();

  for (const cat of categories) {
    const catDates = new Set(
      records
        .filter(r => r.category === cat || (cat === 'coding' && ['github','leetcode','hackerrank','codechef','codeforces','gfg'].includes(r.platform)))
        .map(r => r.date)
    );

    const activeToday = catDates.has(today);
    let streak = 0;

    if (activeToday) {
      let d = today;
      while (catDates.has(d)) {
        streak++;
        d = getPreviousDate(d);
      }
    } else if (catDates.has(yesterday)) {
      let d = yesterday;
      while (catDates.has(d)) {
        streak++;
        d = getPreviousDate(d);
      }
    }

    results[cat] = {
      category: cat,
      current: streak,
      activeToday,
      atRisk: streak > 0 && !activeToday,
      totalDays: catDates.size
    };
  }

  return results;
}

// ─── TODAY'S PLAN & PRIORITY ENGINE ─────────────────────────────

async function getTodaysPlan(userId, timezone = 'Asia/Kolkata') {
  const today = getTodayInTimezone(timezone);
  const dayOfWeek = getDayOfWeekInTimezone(new Date(), timezone);

  const goals = await ActivityGoal.find({ userId, enabled: true }).lean();
  const todayRecords = await ActivityRecord.find({ userId, date: today, completed: true }).lean();

  const recordMap = new Map();
  for (const r of todayRecords) {
    if (r.goalId) {
      recordMap.set(r.goalId.toString(), r);
    }
  }

  // Filter goals that are scheduled for today
  const scheduledGoals = goals.filter(g => {
    if (g.frequency === 'daily') return true;
    if (g.frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
    if (g.frequency === 'custom') return (g.customDays || []).includes(dayOfWeek);
    return true;
  });

  const formattedGoals = scheduledGoals.map(goal => {
    const record = recordMap.get(goal._id.toString());
    const isCompleted = !!record;
    
    // Priority calculation: high priority if streak is at risk (streak >= 3), or explicitly set to high
    let priority = goal.priority || 'medium';
    if (!isCompleted && (goal.currentStreak || 0) >= 3) {
      priority = 'high';
    }

    return {
      ...goal,
      completedToday: isCompleted,
      completionType: record?.completionType || goal.trackingMode || 'manual',
      completedAt: record?.createdAt || null,
      priority,
      target: goal.target || (goal.targetValue ? `${goal.targetValue} ${goal.targetMetric || 'items'}` : '')
    };
  });

  // Sort: High priority incomplete first, then Medium, Low, then Completed at the bottom
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  formattedGoals.sort((a, b) => {
    if (a.completedToday !== b.completedToday) return a.completedToday ? 1 : -1;
    return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
  });

  const total = formattedGoals.length;
  const completed = formattedGoals.filter(g => g.completedToday).length;
  const remaining = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    goals: formattedGoals,
    total,
    completed,
    remaining,
    percentage
  };
}

// ─── WEEKLY ANALYTICS & HEATMAP ─────────────────────────────────

async function getWeeklyAnalytics(userId, timezone = 'Asia/Kolkata') {
  const today = getTodayInTimezone(timezone);
  const now = new Date();
  const dayOfWeek = getDayOfWeekInTimezone(now, timezone); // 0 = Sunday, 1 = Monday, ...

  // Generate current week dates starting with Sunday (Sunday as the starting day)
  let sunday = today;
  for (let i = 0; i < dayOfWeek; i++) {
    sunday = getPreviousDate(sunday);
  }

  const currentWeekDays = [];
  let cur = sunday;
  for (let i = 0; i < 7; i++) {
    currentWeekDays.push(cur);
    cur = getNextDate(cur);
  }

  // Generate previous week dates starting with the previous Sunday
  let prevSunday = sunday;
  for (let i = 0; i < 7; i++) {
    prevSunday = getPreviousDate(prevSunday);
  }
  const previousWeekDays = [];
  let pCur = prevSunday;
  for (let i = 0; i < 7; i++) {
    previousWeekDays.push(pCur);
    pCur = getNextDate(pCur);
  }

  const allQueryDates = [...previousWeekDays, ...currentWeekDays];
  const records = await ActivityRecord.find({
    userId,
    date: { $in: allQueryDates },
    completed: true
  }).lean();

  const recordByDate = {};
  for (const r of records) {
    if (!recordByDate[r.date]) {
      recordByDate[r.date] = { count: 0, categories: { coding: 0, learning: 0, project: 0, career: 0 } };
    }
    recordByDate[r.date].count++;
    const cat = r.category || 'coding';
    if (recordByDate[r.date].categories[cat] !== undefined) {
      recordByDate[r.date].categories[cat]++;
    }
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = currentWeekDays.map(dateStr => {
    const d = new Date(dateStr + 'T12:00:00Z');
    const dayName = dayNames[d.getUTCDay()];
    const entry = recordByDate[dateStr] || { count: 0, categories: { coding: 0, learning: 0, project: 0, career: 0 } };
    return {
      date: dateStr,
      dayName,
      active: entry.count > 0,
      activityCount: entry.count,
      categories: entry.categories
    };
  });

  const activeDaysCount = days.filter(d => d.active).length;
  const totalActivitiesThisWeek = days.reduce((sum, d) => sum + d.activityCount, 0);

  // Previous week metrics for comparison
  const prevActiveDaysCount = previousWeekDays.filter(d => (recordByDate[d]?.count || 0) > 0).length;
  const prevTotalActivities = previousWeekDays.reduce((sum, d) => sum + (recordByDate[d]?.count || 0), 0);

  let comparison = null;
  if (prevTotalActivities > 0 || prevActiveDaysCount > 0) {
    const activeDaysDiff = activeDaysCount - prevActiveDaysCount;
    const activitiesDiff = totalActivitiesThisWeek - prevTotalActivities;
    const percentChange = prevTotalActivities > 0
      ? Math.round((activitiesDiff / prevTotalActivities) * 100)
      : null;

    comparison = {
      activeDaysDiff,
      activitiesDiff,
      percentChange: percentChange !== null ? (percentChange >= 0 ? `+${percentChange}%` : `${percentChange}%`) : null
    };
  }

  return {
    days,
    activeDaysCount,
    totalActivities: totalActivitiesThisWeek,
    period: { start: currentWeekDays[0], end: currentWeekDays[currentWeekDays.length - 1] },
    comparison
  };
}

async function getHeatmapData(userId, timezone = 'Asia/Kolkata', daysCount = 365) {
  const today = getTodayInTimezone(timezone);
  const dates = [];
  let cur = today;
  for (let i = 0; i < daysCount; i++) {
    dates.unshift(cur);
    cur = getPreviousDate(cur);
  }

  const records = await ActivityRecord.find({
    userId,
    date: { $gte: dates[0], $lte: today },
    completed: true
  }).select('date category').lean();

  const countMap = {};
  for (const r of records) {
    if (!countMap[r.date]) {
      countMap[r.date] = { count: 0, coding: 0, learning: 0, project: 0, career: 0 };
    }
    countMap[r.date].count++;
    const cat = r.category || 'coding';
    if (countMap[r.date][cat] !== undefined) {
      countMap[r.date][cat]++;
    }
  }

  const points = dates.map(date => ({
    date,
    count: countMap[date]?.count || 0,
    categories: countMap[date] ? {
      coding: countMap[date].coding,
      learning: countMap[date].learning,
      project: countMap[date].project,
      career: countMap[date].career
    } : { coding: 0, learning: 0, project: 0, career: 0 }
  }));

  return {
    points,
    totalDays: daysCount,
    activeDays: Object.keys(countMap).length,
    totalActivities: records.length
  };
}

// ─── CHRONOLOGICAL ACTIVITY TIMELINE ────────────────────────────

async function getActivityTimeline(userId, options = {}) {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const query = { userId, completed: true };
  if (options.category && options.category !== 'all') {
    query.category = options.category;
  }
  if (options.platform && options.platform !== 'all') {
    query.platform = options.platform;
  }

  const [records, total] = await Promise.all([
    ActivityRecord.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('goalId', 'title category platform trackingMode')
      .lean(),
    ActivityRecord.countDocuments(query)
  ]);

  const items = records.map(r => ({
    id: r._id,
    title: r.sourceTitle || r.title || r.goalId?.title || `${r.platform} Activity`,
    date: r.date,
    platform: r.platform,
    category: r.category || r.goalId?.category || 'coding',
    completionType: r.completionType || 'manual', // 'api-verified', 'auto-detected', 'manual'
    source: r.completionType || 'manual',
    createdAt: r.createdAt || r.detectedAt,
    notes: r.notes || '',
    goalTitle: r.goalId?.title || null
  }));

  return {
    timeline: items,
    items,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

// ─── BEHAVIORAL INSIGHTS & PERSONAL RECORDS ─────────────────────

async function getBehavioralInsights(userId, timezone = 'Asia/Kolkata') {
  const today = getTodayInTimezone(timezone);
  const overall = await calculateOverallStreak(userId, timezone);
  const weekly = await getWeeklyAnalytics(userId, timezone);
  const categoryStreaks = await calculateCategoryStreaks(userId, timezone);

  const insights = [];

  // 1. Streak at risk insight (high urgency)
  if (overall.atRisk && overall.current >= 2) {
    insights.push({
      type: 'warning',
      category: 'streak',
      title: 'Streak at Risk Today',
      description: `Your ${overall.current}-day activity streak needs an activity today to stay alive!`,
      actionUrl: '/activity'
    });
  }

  // 2. Consistency momentum insight
  if (weekly.activeDaysCount >= 5) {
    insights.push({
      type: 'success',
      category: 'consistency',
      title: 'Strong Weekly Momentum',
      description: `You've been active on ${weekly.activeDaysCount} of the last 7 days. Consistency is compounding!`,
      actionUrl: '/activity'
    });
  } else if (weekly.activeDaysCount >= 3) {
    insights.push({
      type: 'info',
      category: 'consistency',
      title: 'Building Momentum',
      description: `You have ${weekly.activeDaysCount} active days this week. Complete today's plan to push it higher.`,
      actionUrl: '/activity'
    });
  }

  // 3. Top category insight
  const catEntries = Object.values(categoryStreaks);
  catEntries.sort((a, b) => b.totalDays - a.totalDays);
  if (catEntries.length > 0 && catEntries[0].totalDays > 0) {
    const top = catEntries[0];
    const catName = top.category.charAt(0).toUpperCase() + top.category.slice(1);
    insights.push({
      type: 'highlight',
      category: top.category,
      title: `${catName} is Your Strongest Area`,
      description: `You have recorded ${top.totalDays} active days in ${catName}. Keep up the great work!`,
      actionUrl: '/activity'
    });
  }

  // 4. Milestone proximity
  if (overall.milestones.next && overall.milestones.daysRemaining <= 3 && overall.milestones.daysRemaining > 0) {
    insights.push({
      type: 'milestone',
      category: 'achievement',
      title: `Upcoming ${overall.milestones.next}-Day Milestone!`,
      description: `You are only ${overall.milestones.daysRemaining} day${overall.milestones.daysRemaining === 1 ? '' : 's'} away from hitting a ${overall.milestones.next}-day milestone!`,
      actionUrl: '/activity'
    });
  }

  return insights;
}

async function getPersonalRecords(userId, timezone = 'Asia/Kolkata') {
  const records = await ActivityRecord.find({ userId, completed: true }).select('date platform category').lean();
  const overall = await calculateOverallStreak(userId, timezone);

  // Most active day of week
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (const r of records) {
    const d = new Date(r.date + 'T12:00:00Z');
    dayCounts[d.getUTCDay()]++;
  }

  let maxDayIdx = 0;
  for (let i = 1; i < 7; i++) {
    if (dayCounts[i] > dayCounts[maxDayIdx]) maxDayIdx = i;
  }

  // Most active platform
  const platformCounts = {};
  for (const r of records) {
    if (r.platform && r.platform !== 'custom') {
      platformCounts[r.platform] = (platformCounts[r.platform] || 0) + 1;
    }
  }

  let mostConsistentPlatform = null;
  let maxPlatCount = 0;
  for (const [p, c] of Object.entries(platformCounts)) {
    if (c > maxPlatCount) {
      maxPlatCount = c;
      mostConsistentPlatform = PLATFORM_INFO[p]?.name || p;
    }
  }

  return {
    longestOverallStreak: overall.longest,
    currentOverallStreak: overall.current,
    totalActivities: records.length,
    totalActiveDays: overall.totalActiveDays,
    mostActiveDayOfWeek: records.length > 0 ? dayNames[maxDayIdx] : '—',
    mostConsistentPlatform: mostConsistentPlatform || '—'
  };
}

// ─── CONSISTENCY SCORE (0–100) ──────────────────────────────────

async function getConsistencyScore(userId, timezone = 'Asia/Kolkata') {
  const weekly = await getWeeklyAnalytics(userId, timezone);
  const overall = await calculateOverallStreak(userId, timezone);
  const plan = await getTodaysPlan(userId, timezone);

  // 1. Active days factor (up to 50 pts)
  const activeDaysScore = Math.round((weekly.activeDaysCount / 7) * 50);

  // 2. Goal completion factor (up to 30 pts)
  const goalScore = plan.total > 0
    ? Math.round((plan.completed / plan.total) * 30)
    : 20; // default baseline if no goals configured

  // 3. Streak momentum factor (up to 20 pts)
  const streakScore = Math.min(Math.round((overall.current / 21) * 20), 20);

  const totalScore = Math.min(activeDaysScore + goalScore + streakScore, 100);

  return {
    score: totalScore,
    grade: totalScore >= 85 ? 'Exceptional' : totalScore >= 70 ? 'Consistent' : totalScore >= 50 ? 'Developing' : 'Starting',
    breakdown: [
      { label: 'Weekly Active Days', value: `${weekly.activeDaysCount}/7 days`, points: activeDaysScore, max: 50 },
      { label: 'Today\'s Goal Execution', value: `${plan.completed}/${plan.total} completed`, points: goalScore, max: 30 },
      { label: 'Active Streak Momentum', value: `${overall.current} days`, points: streakScore, max: 20 }
    ]
  };
}

// ─── MASTER DASHBOARD SUMMARY ───────────────────────────────────

async function getDashboardSummary(userId, timezone = 'Asia/Kolkata') {
  const cacheKey = `activity:dashboard:${userId}`;
  if (process.env.NODE_ENV !== 'test') {
    const cached = await cache.get(cacheKey);
    if (cached) return cached;
  }

  const today = getTodayInTimezone(timezone);
  const dayOfWeek = getDayOfWeekInTimezone(new Date(), timezone);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Run platform auto-sync in the background if needed
  syncUserPlatformActivities(userId, timezone).catch(err =>
    console.error('[Activity] Auto-sync error:', err.message)
  );

  const [
    overallStreak,
    categoryStreaks,
    todaysPlan,
    weekly,
    timeline,
    insights,
    consistency,
    integrations,
    records,
    scheduleContext
  ] = await Promise.all([
    calculateOverallStreak(userId, timezone),
    calculateCategoryStreaks(userId, timezone),
    getTodaysPlan(userId, timezone),
    getWeeklyAnalytics(userId, timezone),
    getActivityTimeline(userId, { limit: 6 }),
    getBehavioralInsights(userId, timezone),
    getConsistencyScore(userId, timezone),
    getUserIntegrations(userId),
    getPersonalRecords(userId, timezone),
    calendarSyncService.getScheduleContext(userId, timezone).catch(() => ({
      eventsCount: 0,
      events: [],
      freeWindows: [],
      totalFreeMinutes: 0,
      nextEvent: null
    }))
  ]);

  // Schedule Intelligence: If user has a free time window today and remaining goals, inject Next Best Action insight
  if (scheduleContext?.freeWindows?.length > 0 && todaysPlan?.remaining > 0) {
    const bestWindow = scheduleContext.freeWindows[0];
    const pending = todaysPlan.goals?.find(g => !g.completed);
    if (pending) {
      insights.unshift({
        type: 'action',
        category: 'schedule',
        title: `${bestWindow.durationMinutes} Minutes Available Today`,
        description: `You have ${bestWindow.durationMinutes} mins free${scheduleContext.nextEvent ? ` before "${scheduleContext.nextEvent.title}"` : ''}. Suggested: ${pending.title}.`,
        actionUrl: '/activity'
      });
    }
  }

    const devProfile = await DevProfile.findOne({ user: userId }).select('lastRemoteSyncAt lastSuccessfulRemoteSyncAt lastSyncAttemptAt syncStatus').lean();

    const summary = {
      today: {
        date: today,
        dayName: dayNames[dayOfWeek],
        totalGoals: todaysPlan.total,
        completedGoals: todaysPlan.completed,
        remainingGoals: todaysPlan.remaining,
        percentage: todaysPlan.percentage
      },
      syncFreshness: {
        lastRemoteSyncAt: devProfile?.lastRemoteSyncAt || null,
        lastSuccessfulRemoteSyncAt: devProfile?.lastSuccessfulRemoteSyncAt || null,
        lastSyncAttemptAt: devProfile?.lastSyncAttemptAt || null,
        syncStatus: devProfile?.syncStatus || 'success'
      },
      scheduleContext: {
        eventsCount: scheduleContext?.eventsCount || 0,
        totalFreeMinutes: scheduleContext?.totalFreeMinutes || 0,
        freeWindows: scheduleContext?.freeWindows || [],
        nextEvent: scheduleContext?.nextEvent || null,
        events: scheduleContext?.events || []
      },
      // Backwards compatibility for existing dashboard callers and tests:
      todaysGoals: {
        total: todaysPlan.total,
        completed: todaysPlan.completed,
        pending: todaysPlan.remaining,
        goals: todaysPlan.goals || []
      },
      currentStreak: overallStreak.current,
      longestStreak: overallStreak.longest,
      overallStreak,
      categoryStreaks,
      todaysPlan,
      weekly,
      recentActivity: timeline.items,
      insights,
      consistency,
      integrations,
      personalRecords: records
    };

    // Cache for 3 minutes for high responsiveness in production
    if (process.env.NODE_ENV !== 'test') {
      await cache.set(cacheKey, summary, 180);
    }
  return summary;
}

// ─── MANUAL GOAL COMPLETION ─────────────────────────────────────

async function completeGoal(userId, goalId, timezone = 'Asia/Kolkata') {
  const today = getTodayInTimezone(timezone);
  const goal = await ActivityGoal.findOne({ _id: goalId, userId });
  if (!goal) throw new Error('Goal not found');

  let record = await ActivityRecord.findOne({ userId, goalId, date: today });
  if (record && record.completed) {
    return { alreadyCompleted: true, record, goal };
  }

  if (!record) {
    record = new ActivityRecord({
      userId,
      goalId,
      platform: goal.platform,
      category: goal.category,
      title: goal.title,
      sourceTitle: goal.title,
      date: today,
      completed: true,
      completionType: 'manual'
    });
  } else {
    record.completed = true;
    record.completionType = 'manual';
    if (!record.title) record.title = goal.title;
  }
  await record.save();

  // Centralized schedule-aware streak reconciliation from ActivityRecord truth (Phase 5 & 11)
  await reconcileGoalStreak(goal._id, userId, timezone);
  const updatedGoal = await ActivityGoal.findById(goal._id);

  // Invalidate cache
  await cache.del(`activity:dashboard:${userId}`);

  return { alreadyCompleted: false, record, goal: updatedGoal || goal };
}

async function getWeeklySummary(userId, timezone = 'Asia/Kolkata') {
  return getWeeklyAnalytics(userId, timezone);
}

module.exports = {
  PLATFORM_INFO,
  PLATFORM_FETCHERS,
  MILESTONES,
  getUserIntegrations,
  refreshPlatformData,
  syncUserPlatformActivities,
  syncUserActivityIntelligence,
  reconcileGoalStreak,
  calculateOverallStreak,
  calculateCategoryStreaks,
  getTodaysPlan,
  getWeeklyAnalytics,
  getHeatmapData,
  getActivityTimeline,
  getBehavioralInsights,
  getPersonalRecords,
  getConsistencyScore,
  getDashboardSummary,
  completeGoal,
  getWeeklySummary,
  getTodayInTimezone,
  formatDateInTimezone,
  getPreviousDate,
  getNextDate,
  normalizePlatformData
};
