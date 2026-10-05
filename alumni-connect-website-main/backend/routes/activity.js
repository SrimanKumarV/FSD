const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const ActivityGoal = require('../models/ActivityGoal');
const ActivityRecord = require('../models/ActivityRecord');
const ReminderPreference = require('../models/ReminderPreference');
const Notification = require('../models/Notification');
const activityService = require('../services/activityService');
const cache = require('../utils/cache');

// Validation helper
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: 'Validation error', errors: errors.array() });
    return false;
  }
  return true;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DASHBOARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get activity intelligence dashboard summary
// @route   GET /api/activity/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const prefs = await ReminderPreference.findOne({ userId: req.user._id });
    const timezone = prefs?.timezone || 'Asia/Kolkata';
    const summary = await activityService.getDashboardSummary(req.user._id, timezone);
    res.json(summary);
  } catch (error) {
    console.error('[Activity] Dashboard error:', error.message);
    res.status(500).json({ message: 'Failed to load dashboard' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PLATFORM SYNC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Synchronize all connected platforms
// @route   POST /api/activity/sync
// @access  Private
router.post('/sync', protect, async (req, res) => {
  try {
    const prefs = await ReminderPreference.findOne({ userId: req.user._id });
    const timezone = prefs?.timezone || 'Asia/Kolkata';
    const result = await activityService.syncUserPlatformActivities(req.user._id, timezone, true);
    await cache.del(`activity:dashboard:${req.user._id}`);
    const summary = await activityService.getDashboardSummary(req.user._id, timezone);
    res.json({ message: 'Sync complete', ...result, summary });
  } catch (error) {
    console.error('[Activity] Sync error:', error.message);
    res.status(500).json({ message: 'Failed to synchronize activities' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIMELINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get chronological activity timeline
// @route   GET /api/activity/timeline
// @access  Private
router.get('/timeline', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, platform } = req.query;
    const timeline = await activityService.getActivityTimeline(req.user._id, {
      page,
      limit,
      category,
      platform
    });
    res.json(timeline);
  } catch (error) {
    console.error('[Activity] Timeline error:', error.message);
    res.status(500).json({ message: 'Failed to load timeline' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANALYTICS & HEATMAP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get detailed activity analytics and heatmap
// @route   GET /api/activity/analytics
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const prefs = await ReminderPreference.findOne({ userId: req.user._id });
    const timezone = prefs?.timezone || 'Asia/Kolkata';
    const days = parseInt(req.query.days, 10) || 365;

    const [weekly, heatmap, consistency, categories] = await Promise.all([
      activityService.getWeeklyAnalytics(req.user._id, timezone),
      activityService.getHeatmapData(req.user._id, timezone, days),
      activityService.getConsistencyScore(req.user._id, timezone),
      activityService.calculateCategoryStreaks(req.user._id, timezone)
    ]);

    res.json({
      weekly,
      heatmap,
      consistency,
      consistencyScore: consistency.score,
      categories
    });
  } catch (error) {
    console.error('[Activity] Analytics error:', error.message);
    res.status(500).json({ message: 'Failed to load analytics' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STREAKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get all streak metrics (overall, category, goals, milestones)
// @route   GET /api/activity/streaks
// @access  Private
router.get('/streaks', protect, async (req, res) => {
  try {
    const prefs = await ReminderPreference.findOne({ userId: req.user._id });
    const timezone = prefs?.timezone || 'Asia/Kolkata';

    const [overall, categories, goals] = await Promise.all([
      activityService.calculateOverallStreak(req.user._id, timezone),
      activityService.calculateCategoryStreaks(req.user._id, timezone),
      ActivityGoal.find({ userId: req.user._id, enabled: true }).select('title currentStreak longestStreak platform category').lean()
    ]);

    res.json({
      overall,
      categories,
      goals
    });
  } catch (error) {
    console.error('[Activity] Streaks error:', error.message);
    res.status(500).json({ message: 'Failed to load streaks' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INSIGHTS & RECORDS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get behavioral insights and personal records
// @route   GET /api/activity/insights
// @access  Private
router.get('/insights', protect, async (req, res) => {
  try {
    const prefs = await ReminderPreference.findOne({ userId: req.user._id });
    const timezone = prefs?.timezone || 'Asia/Kolkata';

    const [insights, records] = await Promise.all([
      activityService.getBehavioralInsights(req.user._id, timezone),
      activityService.getPersonalRecords(req.user._id, timezone)
    ]);

    res.json({
      insights,
      records,
      personalRecords: records
    });
  } catch (error) {
    console.error('[Activity] Insights error:', error.message);
    res.status(500).json({ message: 'Failed to load insights' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTEGRATIONS (read from DevProfile)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get all platform integrations
// @route   GET /api/activity/integrations
// @access  Private
router.get('/integrations', protect, async (req, res) => {
  try {
    const integrations = await activityService.getUserIntegrations(req.user._id);
    res.json(integrations);
  } catch (error) {
    console.error('[Activity] Integrations error:', error.message);
    res.status(500).json({ message: 'Failed to load integrations' });
  }
});

// @desc    Refresh a specific platform's data
// @route   POST /api/activity/integrations/:platform/refresh
// @access  Private
router.post('/integrations/:platform/refresh', protect, async (req, res) => {
  try {
    const { platform } = req.params;
    const validPlatforms = Object.keys(activityService.PLATFORM_INFO);
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    const result = await activityService.refreshPlatformData(req.user._id, platform);
    if (!result) {
      return res.status(404).json({ message: 'Platform not connected or username not set' });
    }

    res.json(result);
  } catch (error) {
    console.error('[Activity] Refresh error:', error.message);
    res.status(500).json({ message: 'Failed to refresh platform data' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GOALS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get all goals for current user
// @route   GET /api/activity/goals
// @access  Private
router.get('/goals', protect, async (req, res) => {
  try {
    const goals = await ActivityGoal.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    
    const prefs = await ReminderPreference.findOne({ userId: req.user._id });
    const timezone = prefs?.timezone || 'Asia/Kolkata';
    const today = activityService.getTodayInTimezone(timezone);
    const todayRecords = await ActivityRecord.find({
      userId: req.user._id,
      date: today,
      completed: true
    }).lean();

    const recordMap = new Map();
    todayRecords.forEach(r => {
      if (r.goalId) recordMap.set(r.goalId.toString(), r);
    });

    const goalsWithStatus = goals.map(g => {
      const rec = recordMap.get(g._id.toString());
      return {
        ...g,
        completedToday: !!rec,
        completionType: rec?.completionType || g.trackingMode || 'manual'
      };
    });

    res.json(goalsWithStatus);
  } catch (error) {
    console.error('[Activity] Goals fetch error:', error.message);
    res.status(500).json({ message: 'Failed to load goals' });
  }
});

// @desc    Create a new goal
// @route   POST /api/activity/goals
// @access  Private
router.post('/goals', protect, [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('category').optional().isIn(['coding', 'learning', 'career', 'project', 'custom']),
  body('platform').optional().isIn(['leetcode', 'github', 'duolingo', 'hackerrank', 'codechef', 'codeforces', 'gfg', 'kaggle', 'custom']),
  body('frequency').optional().isIn(['daily', 'weekdays', 'custom']),
  body('trackingMode').optional().isIn(['manual', 'automatic', 'hybrid']),
  body('priority').optional().isIn(['high', 'medium', 'low']),
  body('target').optional().isLength({ max: 100 }),
  body('reminderTime').optional().matches(/^\d{2}:\d{2}$/).withMessage('Time must be in HH:mm format'),
], async (req, res) => {
  if (!validate(req, res)) return;

  try {
    const existingCount = await ActivityGoal.countDocuments({ userId: req.user._id });
    if (existingCount >= 20) {
      return res.status(400).json({ message: 'Maximum 20 goals allowed. Delete some goals first.' });
    }

    const goal = new ActivityGoal({
      userId: req.user._id,
      ...req.body
    });

    await goal.save();
    await cache.del(`activity:dashboard:${req.user._id}`);
    res.status(201).json(goal);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A goal with this title already exists' });
    }
    console.error('[Activity] Goal create error:', error.message);
    res.status(500).json({ message: 'Failed to create goal' });
  }
});

// @desc    Update a goal
// @route   PUT /api/activity/goals/:id
// @access  Private
router.put('/goals/:id', protect, [
  param('id').isMongoId(),
  body('title').optional().trim().isLength({ min: 1, max: 100 }),
  body('category').optional().isIn(['coding', 'learning', 'career', 'project', 'custom']),
  body('frequency').optional().isIn(['daily', 'weekdays', 'custom']),
  body('trackingMode').optional().isIn(['manual', 'automatic', 'hybrid']),
  body('priority').optional().isIn(['high', 'medium', 'low']),
  body('reminderTime').optional().matches(/^\d{2}:\d{2}$/)
], async (req, res) => {
  if (!validate(req, res)) return;

  try {
    const goal = await ActivityGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    await cache.del(`activity:dashboard:${req.user._id}`);
    res.json(goal);
  } catch (error) {
    console.error('[Activity] Goal update error:', error.message);
    res.status(500).json({ message: 'Failed to update goal' });
  }
});

// @desc    Delete a goal
// @route   DELETE /api/activity/goals/:id
// @access  Private
router.delete('/goals/:id', protect, async (req, res) => {
  try {
    const goal = await ActivityGoal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    await ActivityRecord.deleteMany({ goalId: req.params.id });
    await cache.del(`activity:dashboard:${req.user._id}`);

    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('[Activity] Goal delete error:', error.message);
    res.status(500).json({ message: 'Failed to delete goal' });
  }
});

// @desc    Mark a goal as completed for today
// @route   POST /api/activity/goals/:id/complete
// @access  Private
router.post('/goals/:id/complete', protect, async (req, res) => {
  try {
    const prefs = await ReminderPreference.findOne({ userId: req.user._id });
    const timezone = prefs?.timezone || 'Asia/Kolkata';

    const result = await activityService.completeGoal(req.user._id, req.params.id, timezone);

    if (result.alreadyCompleted) {
      return res.json({ message: 'Already completed today', ...result });
    }

    // Check for milestone notifications
    const milestones = [7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
    const streak = result.goal.currentStreak;
    if (milestones.includes(streak)) {
      await Notification.createNotification({
        recipient: req.user._id,
        type: 'activity-milestone',
        title: `🏆 ${streak}-Day Streak Milestone!`,
        content: `Incredible! You've maintained your "${result.goal.title}" habit for ${streak} consecutive days.`,
        priority: 'normal',
        metadata: { source: 'system', category: 'activity' },
        actionUrl: '/activity'
      }).catch(e => console.error(e));
    }

    res.json({ message: 'Goal completed!', ...result });
  } catch (error) {
    console.error('[Activity] Goal complete error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to complete goal' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REMINDER PREFERENCES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get reminder preferences
// @route   GET /api/activity/preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
  try {
    let prefs = await ReminderPreference.findOne({ userId: req.user._id });
    if (!prefs) {
      prefs = await ReminderPreference.create({ userId: req.user._id });
    }
    res.json(prefs);
  } catch (error) {
    console.error('[Activity] Preferences fetch error:', error.message);
    res.status(500).json({ message: 'Failed to load preferences' });
  }
});

// @desc    Update reminder preferences
// @route   PUT /api/activity/preferences
// @access  Private
router.put('/preferences', protect, [
  body('reminderTime').optional().matches(/^\d{2}:\d{2}$/),
  body('quietHoursStart').optional().matches(/^\d{2}:\d{2}$/),
  body('quietHoursEnd').optional().matches(/^\d{2}:\d{2}$/),
  body('timezone').optional().isString().isLength({ min: 1, max: 50 }),
], async (req, res) => {
  if (!validate(req, res)) return;

  try {
    const prefs = await ReminderPreference.findOneAndUpdate(
      { userId: req.user._id },
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(prefs);
  } catch (error) {
    console.error('[Activity] Preferences update error:', error.message);
    res.status(500).json({ message: 'Failed to update preferences' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WEEKLY SUMMARY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get weekly summary
// @route   GET /api/activity/summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const prefs = await ReminderPreference.findOne({ userId: req.user._id });
    const timezone = prefs?.timezone || 'Asia/Kolkata';
    const summary = await activityService.getWeeklySummary(req.user._id, timezone);
    res.json(summary);
  } catch (error) {
    console.error('[Activity] Summary error:', error.message);
    res.status(500).json({ message: 'Failed to load summary' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PRIVACY — DELETE ALL ACTIVITY DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Delete all activity data for current user
// @route   DELETE /api/activity/data
// @access  Private
router.delete('/data', protect, async (req, res) => {
  try {
    await Promise.all([
      ActivityGoal.deleteMany({ userId: req.user._id }),
      ActivityRecord.deleteMany({ userId: req.user._id }),
      ReminderPreference.deleteMany({ userId: req.user._id })
    ]);

    await cache.del(`activity:dashboard:${req.user._id}`);
    await cache.del(`activity:integrations:${req.user._id}`);

    res.json({ message: 'All activity data deleted' });
  } catch (error) {
    console.error('[Activity] Data delete error:', error.message);
    res.status(500).json({ message: 'Failed to delete activity data' });
  }
});

// @desc    Export user's activity data as JSON
// @route   GET /api/activity/export
// @access  Private
router.get('/export', protect, async (req, res) => {
  try {
    const [goals, records, prefs] = await Promise.all([
      ActivityGoal.find({ userId: req.user._id }).lean(),
      ActivityRecord.find({ userId: req.user._id }).sort({ date: -1 }).lean(),
      ReminderPreference.findOne({ userId: req.user._id }).lean()
    ]);
    res.json({
      exportedAt: new Date().toISOString(),
      user: req.user.email,
      preferences: prefs,
      goals,
      records
    });
  } catch (error) {
    console.error('[Activity] Export error:', error.message);
    res.status(500).json({ message: 'Failed to export activity data' });
  }
});

// @desc    Clear activity records while preserving goals & settings
// @route   DELETE /api/activity/records
// @access  Private
router.delete('/records', protect, async (req, res) => {
  try {
    await ActivityRecord.deleteMany({ userId: req.user._id });
    await cache.del(`activity:dashboard:${req.user._id}`);
    res.json({ message: 'Activity history cleared' });
  } catch (error) {
    console.error('[Activity] Clear records error:', error.message);
    res.status(500).json({ message: 'Failed to clear activity history' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN — AGGREGATE ANALYTICS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get activity system analytics (admin only)
// @route   GET /api/activity/admin/analytics
// @access  Private (Admin)
router.get('/admin/analytics', protect, admin, async (req, res) => {
  try {
    const [
      totalGoals,
      activeGoals,
      totalRecords,
      completedRecords,
      usersWithGoals,
      usersWithReminders,
      recentCompletions
    ] = await Promise.all([
      ActivityGoal.countDocuments(),
      ActivityGoal.countDocuments({ enabled: true }),
      ActivityRecord.countDocuments(),
      ActivityRecord.countDocuments({ completed: true }),
      ActivityGoal.distinct('userId').then(ids => ids.length),
      ReminderPreference.countDocuments(),
      ActivityRecord.countDocuments({
        completed: true,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    res.json({
      totalGoals,
      activeGoals,
      totalRecords,
      completedRecords,
      usersWithGoals,
      usersWithReminders,
      recentCompletions,
      completionRate: totalRecords > 0 ? ((completedRecords / totalRecords) * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('[Activity] Admin analytics error:', error.message);
    res.status(500).json({ message: 'Failed to load analytics' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN — TEST EMAIL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Send a test activity reminder email (admin only)
// @route   POST /api/activity/admin/test-email
// @access  Private (Admin)
router.post('/admin/test-email', protect, admin, async (req, res) => {
  try {
    const sendEmail = require('../utils/sendEmail');
    const { getDailyReminderTemplate } = require('../utils/activityEmailTemplates');

    const testGoals = [
      { title: 'Complete one LeetCode problem', target: 'Easy or Medium' },
      { title: 'Duolingo daily lesson', target: '15 minutes' },
      { title: 'Review DBMS notes', target: '30 minutes' }
    ];

    const html = getDailyReminderTemplate(req.user, testGoals, { currentStreak: 7 });

    const result = await sendEmail({
      email: req.user.email,
      subject: '🔔 [TEST] Your Alumnex Daily Activity Reminder',
      message: html
    });

    res.json({ message: 'Test email sent successfully', result });
  } catch (error) {
    console.error('[Activity] Test email error:', error.message);
    res.status(500).json({ message: 'Failed to send test email', error: error.message });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DIAGNOSTIC SUITE & INCIDENT RECONCILIATION (Phases 14, 35, 65)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get detailed Activity Intelligence & Notification Duplication Diagnostic
// @route   GET /api/activity/diagnostics
// @access  Private
router.get('/diagnostics', protect, async (req, res) => {
  try {
    const DevProfile = require('../models/DevProfile');
    const NotificationDevice = require('../models/NotificationDevice');
    const targetUserId = (req.user.role === 'admin' && req.query.userId) ? req.query.userId : req.user._id;

    const prefs = await ReminderPreference.findOne({ userId: targetUserId }).lean();
    const timezone = prefs?.timezone || 'Asia/Kolkata';
    const today = req.query.date || activityService.getTodayInTimezone(timezone);

    const [user, devProfile, goals, todayRecords, notifications, devices] = await Promise.all([
      require('../models/User').findById(targetUserId).select('name email').lean(),
      DevProfile.findOne({ user: targetUserId }).lean(),
      ActivityGoal.find({ userId: targetUserId }).lean(),
      ActivityRecord.find({ userId: targetUserId, date: today }).lean(),
      Notification.find({
        recipient: targetUserId,
        createdAt: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 2))
        }
      }).sort({ createdAt: -1 }).limit(50).lean(),
      NotificationDevice.find({ userId: targetUserId, platform: 'android' }).lean()
    ]);

    // Filter notifications for target date
    const todayNotifications = notifications.filter(n => {
      const notifDate = activityService.formatDateInTimezone(n.createdAt, timezone);
      return notifDate === today;
    });

    const streakAtRiskNotifs = todayNotifications.filter(n => (n.type || '').toUpperCase().includes('STREAK'));
    const goalReminderNotifs = todayNotifications.filter(n => (n.type || '').toUpperCase().includes('REMINDER') || (n.type || '').toUpperCase().includes('GOAL'));

    // Token analysis
    const tokenCounts = {};
    for (const d of devices) {
      if (d.pushToken) {
        tokenCounts[d.pushToken] = (tokenCounts[d.pushToken] || 0) + 1;
      }
    }
    const uniqueTokens = Object.keys(tokenCounts);
    const duplicateTokens = Object.entries(tokenCounts).filter(([_, count]) => count > 1);

    // Platform analysis
    const platformDiagnostics = {};
    if (devProfile?.stats) {
      for (const [p, stats] of Object.entries(devProfile.stats)) {
        const username = devProfile.usernames?.[p]?.username;
        const normalized = activityService.normalizePlatformData(p, stats, username, timezone);
        platformDiagnostics[p] = {
          username,
          connected: true,
          activityToday: normalized.activityToday,
          lastActivityAt: normalized.lastActivityAt,
          currentStreak: normalized.currentStreak,
          longestStreak: normalized.longestStreak
        };
      }
    }

    // Goals diagnosis
    const goalMap = todayRecords.reduce((acc, r) => {
      if (r.goalId) acc[r.goalId.toString()] = r;
      return acc;
    }, {});

    const goalsDiagnostic = goals.map(g => ({
      goalId: g._id,
      title: g.title,
      platform: g.platform,
      trackingMode: g.trackingMode,
      enabled: g.enabled,
      currentStreak: g.currentStreak,
      longestStreak: g.longestStreak,
      completedToday: !!goalMap[g._id.toString()],
      record: goalMap[g._id.toString()] || null
    }));

    // Diagnostic Verdict (Answers prompt section 35)
    let verdict = 'Healthy';
    const serverSideMultiNotification = streakAtRiskNotifs.length > 1 || goalReminderNotifs.length > 1;
    const deviceRowMultiplication = duplicateTokens.length > 0;

    if (serverSideMultiNotification && deviceRowMultiplication) {
      verdict = 'CRITICAL_MULTIPLE_CAUSES: Multiple server notifications created AND duplicate Android device rows present in database.';
    } else if (serverSideMultiNotification) {
      verdict = 'SERVER_NOTIFICATION_DUPLICATION: The server created multiple notification records (e.g. uncoordinated cron workers).';
    } else if (deviceRowMultiplication) {
      verdict = 'FCM_DELIVERY_DUPLICATION: The server created a single logical notification, but multiple device rows caused FCM to deliver it multiple times.';
    }

    const { minutesUntilMidnight } = require('../utils/timezoneHelper').getMidnightProximity(timezone);

    res.json({
      timestamp: new Date().toISOString(),
      user: {
        id: targetUserId,
        name: user?.name,
        email: user?.email,
        timezone,
        targetDate: today,
        minutesUntilMidnight
      },
      verdict,
      syncFreshness: {
        lastSyncAttemptAt: devProfile?.lastSyncAttemptAt || null,
        lastSuccessfulRemoteSyncAt: devProfile?.lastSuccessfulRemoteSyncAt || null,
        syncStatus: devProfile?.syncStatus || 'unknown',
        platforms: platformDiagnostics
      },
      goals: goalsDiagnostic,
      recordsTodayCount: todayRecords.length,
      notificationsToday: {
        totalRecords: todayNotifications.length,
        streakAtRiskRecords: streakAtRiskNotifs.length,
        goalReminderRecords: goalReminderNotifs.length,
        eventKeys: todayNotifications.map(n => n.dedupKey || n.groupId || 'no_key'),
        details: todayNotifications.map(n => ({
          id: n._id,
          type: n.type,
          title: n.title,
          dedupKey: n.dedupKey,
          createdAt: n.createdAt
        }))
      },
      androidDevices: {
        totalRows: devices.length,
        uniqueTokensCount: uniqueTokens.length,
        duplicateTokensCount: duplicateTokens.length,
        duplicateTokenDetails: duplicateTokens.map(([token, count]) => ({
          tokenMask: token.length > 12 ? `${token.substring(0, 6)}...${token.slice(-6)}` : token,
          count
        })),
        rows: devices.map(d => ({
          id: d._id,
          deviceId: d.deviceId,
          deviceName: d.deviceName,
          enabled: d.enabled,
          tokenMask: d.pushToken ? `${d.pushToken.substring(0, 6)}...${d.pushToken.slice(-6)}` : 'none',
          tokenUpdatedAt: d.tokenUpdatedAt,
          lastSeenAt: d.lastSeenAt
        }))
      }
    });
  } catch (error) {
    console.error('[Activity] Diagnostics error:', error);
    res.status(500).json({ message: 'Diagnostic query failed', error: error.message });
  }
});

// @desc    Perform safe database cleanup for duplicate devices and notifications
// @route   POST /api/activity/diagnostics/cleanup
// @access  Private
router.post('/diagnostics/cleanup', protect, async (req, res) => {
  try {
    const NotificationDevice = require('../models/NotificationDevice');
    const targetUserId = req.user._id;

    // 1. Clean duplicate Android devices for current user, preserving newest
    const devices = await NotificationDevice.find({ userId: targetUserId, platform: 'android' })
      .sort({ tokenUpdatedAt: -1, updatedAt: -1 });

    const seenTokens = new Set();
    const duplicateIds = [];

    for (const dev of devices) {
      if (!dev.pushToken) continue;
      if (seenTokens.has(dev.pushToken)) {
        duplicateIds.push(dev._id);
      } else {
        seenTokens.add(dev.pushToken);
      }
    }

    let devicesCleaned = 0;
    if (duplicateIds.length > 0) {
      const delRes = await NotificationDevice.deleteMany({ _id: { $in: duplicateIds } });
      devicesCleaned = delRes.deletedCount;
    }

    // 2. Reconcile all streaks for user from ActivityRecord durable truth
    const userGoals = await ActivityGoal.find({ userId: targetUserId, enabled: true });
    const prefs = await ReminderPreference.findOne({ userId: targetUserId });
    const tz = prefs?.timezone || 'Asia/Kolkata';

    const reconciledGoals = [];
    for (const g of userGoals) {
      const r = await activityService.reconcileGoalStreak(g._id, targetUserId, tz);
      if (r) reconciledGoals.push(r);
    }

    res.json({
      success: true,
      message: 'Database cleanup and streak reconciliation completed',
      devicesCleaned,
      reconciledGoals
    });
  } catch (error) {
    console.error('[Activity] Cleanup error:', error);
    res.status(500).json({ message: 'Cleanup failed', error: error.message });
  }
});

module.exports = router;
