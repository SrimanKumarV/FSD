const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');
const ReminderPreference = require('../models/ReminderPreference');
const NotificationDevice = require('../models/NotificationDevice');
const webPushService = require('../services/webPushService');
const fcmService = require('../services/fcmService');
const { notificationDispatcher, NOTIFICATION_TYPES } = require('../services/notificationDispatcher');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { type, isRead, priority, page = 1, limit = 20, sort = 'latest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { recipient: req.user.id };

    // Filters
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (priority) query.priority = priority;

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'latest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'priority':
        sortOption = { priority: -1, createdAt: -1 };
        break;
      case 'unread_first':
        sortOption = { isRead: 1, createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name photo role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOption);

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await notification.markAsRead();
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.markAllAsRead(req.user.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark notifications by type as read
// @route   PUT /api/notifications/read-by-type
// @access  Private
router.put('/read-by-type', protect, async (req, res) => {
  try {
    const { type } = req.body;
    if (!type) {
      return res.status(400).json({ message: 'Notification type is required' });
    }

    await Notification.updateMany(
      {
        recipient: req.user.id,
        type,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: `All ${type} notifications marked as read` });
  } catch (error) {
    console.error('Error marking notifications by type as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await notification.remove();
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/delete-read
// @access  Private
router.delete('/delete-read', protect, async (req, res) => {
  try {
    const { type } = req.query;
    let query = { recipient: req.user.id, isRead: true };

    if (type) {
      query.type = type;
    }

    const result = await Notification.deleteMany(query);
    res.json({ 
      message: `${result.deletedCount} notifications deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WEB PUSH & DEVICE REGISTRATION ENDPOINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get VAPID public key for Web Push subscription
// @route   GET /api/notifications/vapid-public-key
// @access  Public
router.get('/vapid-public-key', (req, res) => {
  res.json({
    success: true,
    publicKey: webPushService.getPublicKey()
  });
});

// @desc    Register or update a Web Push subscription
// @route   POST /api/notifications/web-push/subscribe
// @access  Private
router.post('/web-push/subscribe', protect, async (req, res) => {
  try {
    const { subscription, deviceId, deviceName, browser } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: 'Valid push subscription object is required' });
    }

    const effectiveDeviceId = deviceId || require('crypto').createHash('sha256').update(subscription.endpoint).digest('hex').substring(0, 32);

    const device = await NotificationDevice.findOneAndUpdate(
      {
        userId: req.user._id,
        deviceId: effectiveDeviceId,
        platform: 'web'
      },
      {
        $set: {
          pushProvider: 'web-push',
          subscription,
          deviceName: deviceName || 'Web Browser',
          browser: browser || 'Unknown Browser',
          enabled: true,
          lastSeenAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Also update ReminderPreference webPushEnabled flag
    await ReminderPreference.findOneAndUpdate(
      { userId: req.user._id },
      { $set: { webPushEnabled: true } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Web push subscription registered successfully',
      deviceId: device.deviceId
    });
  } catch (error) {
    console.error('[Notifications] Web push subscribe error:', error.message);
    res.status(500).json({ message: 'Failed to save web push subscription' });
  }
});

// @desc    Unsubscribe a Web Push device
// @route   POST /api/notifications/web-push/unsubscribe
// @access  Private
router.post('/web-push/unsubscribe', protect, async (req, res) => {
  try {
    const { endpoint, deviceId } = req.body;

    const filter = { userId: req.user._id, platform: 'web' };
    if (deviceId) filter.deviceId = deviceId;
    else if (endpoint) filter['subscription.endpoint'] = endpoint;

    await NotificationDevice.deleteMany(filter);

    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('[Notifications] Web push unsubscribe error:', error.message);
    res.status(500).json({ message: 'Failed to remove web push subscription' });
  }
});

// @desc    Register a mobile device (Android FCM or Capacitor APK)
// @route   POST /api/notifications/devices/register
// @access  Private
router.post('/devices/register', protect, async (req, res) => {
  try {
    const {
      platform = 'android',
      pushProvider = 'fcm',
      pushToken,
      deviceId,
      deviceName,
      appVersion
    } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: 'deviceId is required' });
    }

    const device = await NotificationDevice.findOneAndUpdate(
      {
        userId: req.user._id,
        deviceId,
        platform
      },
      {
        $set: {
          pushProvider,
          pushToken,
          deviceName: deviceName || (platform === 'android' ? 'Android Device' : 'Device'),
          appVersion,
          enabled: true,
          lastSeenAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Also update ReminderPreference mobileAppEnabled flag
    if (platform === 'android') {
      await ReminderPreference.findOneAndUpdate(
        { userId: req.user._id },
        { $set: { mobileAppEnabled: true } },
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: 'Device registered successfully',
      device
    });
  } catch (error) {
    console.error('[Notifications] Device register error:', error.message);
    res.status(500).json({ message: 'Failed to register device' });
  }
});

// @desc    Unregister a device
// @route   POST /api/notifications/devices/unregister
// @access  Private
router.post('/devices/unregister', protect, async (req, res) => {
  try {
    const { deviceId, platform } = req.body;
    const filter = { userId: req.user._id };
    if (deviceId) filter.deviceId = deviceId;
    if (platform) filter.platform = platform;

    await NotificationDevice.deleteMany(filter);
    res.json({ success: true, message: 'Device unregistered successfully' });
  } catch (error) {
    console.error('[Notifications] Device unregister error:', error.message);
    res.status(500).json({ message: 'Failed to unregister device' });
  }
});

// @desc    List all active notification devices for current user
// @route   GET /api/notifications/devices
// @access  Private
router.get('/devices', protect, async (req, res) => {
  try {
    const devices = await NotificationDevice.find({
      userId: req.user._id,
      enabled: true
    }).select('platform pushProvider deviceId deviceName browser appVersion lastSeenAt lastDeliveryAt lastDeliveryStatus lastError permission enabled createdAt').lean();

    res.json({
      success: true,
      count: devices.length,
      devices
    });
  } catch (error) {
    console.error('[Notifications] Fetch devices error:', error.message);
    res.status(500).json({ message: 'Failed to load registered devices' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UNIFIED NOTIFICATION PREFERENCES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Get user's complete notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
  try {
    let prefs = await ReminderPreference.findOne({ userId: req.user._id });
    if (!prefs) {
      prefs = await ReminderPreference.create({ userId: req.user._id });
    }

    res.json({
      success: true,
      preferences: prefs
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
router.put('/preferences', protect, async (req, res) => {
  try {
    const allowedFields = [
      'emailEnabled', 'inAppEnabled', 'webPushEnabled', 'mobileAppEnabled',
      'emailMode', 'dailyReminder', 'streakAlert', 'milestoneAlert',
      'goalCompletion', 'weeklySummary', 'platformUpdates', 'interviewReminder',
      'mentorshipReminder', 'jobAlerts', 'chatMessages', 'connectionRequests',
      'socialReactions', 'securityAlerts', 'systemAnnouncements', 'reminderTime',
      'quietHoursEnabled', 'quietHoursStart', 'quietHoursEnd', 'timezone', 'reminderDays'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const updated = await ReminderPreference.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: updated
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEST NOTIFICATION SUITE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// @desc    Send a real test notification to specified channel
// @route   POST /api/notifications/test
// @access  Private
router.post('/test', protect, async (req, res) => {
  try {
    const { channel = 'web', type = 'STREAK_AT_RISK' } = req.body;
    const io = req.app.get('io');

    const testEvent = {
      type: NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.STREAK_AT_RISK,
      userId: req.user._id,
      title: '🔥 Alumnex Notification Test',
      body: `Testing ${channel.toUpperCase()} delivery! Your unified multi-channel notifications are working smoothly.`,
      priority: 'high',
      deepLink: '/activity?tab=today',
      data: { test: true, channel, timestamp: new Date().toISOString() },
      io
    };

    // If channel specific test is requested, dispatch directly
    if (channel === 'web') {
      const webResult = await webPushService.sendToUser(req.user._id, {
        title: testEvent.title,
        body: testEvent.body,
        deepLink: testEvent.deepLink,
        type: testEvent.type,
        data: testEvent.data
      });

      return res.json({
        success: webResult.sent > 0,
        channel: 'web',
        deliveredCount: webResult.sent,
        totalDevices: webResult.total,
        details: webResult,
        message: webResult.sent > 0
          ? `Web push sent to ${webResult.sent} active browser(s)!`
          : (webResult.total === 0
              ? 'No active web push subscriptions found. Please enable web notifications in settings first.'
              : 'Failed to deliver web push notification.')
      });
    }

    if (channel === 'android') {
      const fcmResult = await fcmService.sendToUser(req.user._id, {
        title: testEvent.title,
        body: testEvent.body,
        deepLink: testEvent.deepLink,
        type: testEvent.type,
        data: testEvent.data
      });

      return res.json({
        success: fcmResult.sent > 0,
        channel: 'android',
        deliveredCount: fcmResult.sent,
        totalDevices: fcmResult.total,
        details: fcmResult,
        message: fcmResult.sent > 0
          ? `Dispatched to ${fcmResult.sent} registered Android device(s)!`
          : (fcmResult.total === 0
              ? 'No registered Android devices found. Open the Alumnex APK on your Android device to register.'
              : 'Failed to deliver FCM push notification to registered Android device.')
      });
    }

    if (channel === 'in-app') {
      const notifDoc = await Notification.create({
        recipient: req.user._id,
        type: 'test-notification',
        title: testEvent.title,
        content: testEvent.body,
        priority: 'high',
        actionUrl: '/activity',
        metadata: { source: 'system', category: 'test' }
      });

      if (io) {
        io.to(req.user._id.toString()).emit('new-notification', {
          _id: notifDoc._id,
          title: notifDoc.title,
          content: notifDoc.content,
          type: notifDoc.type,
          actionUrl: notifDoc.actionUrl,
          createdAt: notifDoc.createdAt
        });
      }

      return res.json({
        success: true,
        channel: 'in-app',
        notificationId: notifDoc._id,
        message: 'In-app notification created and broadcast via Socket.IO!'
      });
    }

    // Default: Unified dispatch through all eligible channels
    const dispatchResult = await notificationDispatcher.dispatch(testEvent);
    res.json({
      success: true,
      channel: 'unified',
      result: dispatchResult,
      message: 'Test notification processed by Unified Notification Dispatcher.'
    });
  } catch (error) {
    console.error('[Notifications] Test notification error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Test failed' });
  }
});


// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const { period = '30_days' } = req.query;
    
    let startDate;
    switch (period) {
      case '7_days':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30_days':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90_days':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const stats = {
      total: await Notification.countDocuments({ recipient: req.user.id }),
      unread: await Notification.countDocuments({ recipient: req.user.id, isRead: false }),
      recent: await Notification.countDocuments({ 
        recipient: req.user.id, 
        createdAt: { $gte: startDate } 
      }),
      byType: await Notification.aggregate([
        { $match: { recipient: req.user.id } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      byPriority: await Notification.aggregate([
        { $match: { recipient: req.user.id } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark notification as actionable
// @route   PUT /api/notifications/:id/action
// @access  Private
router.put('/:id/action', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!notification.requiresAction) {
      return res.status(400).json({ message: 'Notification does not require action' });
    }

    // Mark as action taken
    notification.actionTaken = true;
    notification.actionTakenAt = new Date();
    await notification.save();

    res.json({ message: 'Action marked as taken' });
  } catch (error) {
    console.error('Error marking notification action:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get actionable notifications
// @route   GET /api/notifications/actionable
// @access  Private
router.get('/actionable', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const actionableNotifications = await Notification.findActionable(req.user.id, {
      skip,
      limit: parseInt(limit)
    });

    const total = await Notification.countDocuments({
      recipient: req.user.id,
      requiresAction: true,
      actionTaken: { $ne: true }
    });

    res.json({
      notifications: actionableNotifications,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching actionable notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
