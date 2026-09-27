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
    const result = await activityService.syncUserPlatformActivities(req.user._id, timezone);
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

    res.json({ message: 'Test email sent', result });
  } catch (error) {
    console.error('[Activity] Test email error:', error.message);
    res.status(500).json({ message: 'Failed to send test email', error: error.message });
  }
});

module.exports = router;
