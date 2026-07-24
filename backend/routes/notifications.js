const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Notification = require('../models/Notification');

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

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
router.get('/preferences', protect, async (req, res) => {
  try {
    // This would typically fetch from a user preferences model
    // For now, return default preferences
    const preferences = {
      email: {
        mentorship: true,
        jobs: true,
        events: true,
        forum: true,
        contests: true,
        messages: true,
        system: true
      },
      push: {
        mentorship: true,
        jobs: true,
        events: true,
        forum: true,
        contests: true,
        messages: true,
        system: false
      },
      frequency: 'immediate', // immediate, daily, weekly
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    res.json({ preferences });
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
    const {
      email, push, frequency, quietHours
    } = req.body;

    // Validate preferences
    if (email && typeof email === 'object') {
      for (const key in email) {
        if (typeof email[key] !== 'boolean') {
          return res.status(400).json({ message: 'Email preferences must be boolean values' });
        }
      }
    }

    if (push && typeof push === 'object') {
      for (const key in push) {
        if (typeof push[key] !== 'boolean') {
          return res.status(400).json({ message: 'Push preferences must be boolean values' });
        }
      }
    }

    if (frequency && !['immediate', 'daily', 'weekly'].includes(frequency)) {
      return res.status(400).json({ message: 'Invalid frequency value' });
    }

    if (quietHours && typeof quietHours === 'object') {
      if (typeof quietHours.enabled !== 'boolean') {
        return res.status(400).json({ message: 'Quiet hours enabled must be boolean' });
      }
      if (quietHours.enabled) {
        if (!quietHours.start || !quietHours.end) {
          return res.status(400).json({ message: 'Start and end times required when quiet hours enabled' });
        }
      }
    }

    // TODO: Save preferences to user model or separate preferences model
    // For now, just return success

    res.json({ message: 'Notification preferences updated successfully' });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ message: 'Server error' });
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
