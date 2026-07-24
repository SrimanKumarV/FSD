const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, admin } = require('../middleware/auth');
const User = require('../models/User');
const Job = require('../models/Job');
const Event = require('../models/Event');
const ForumPost = require('../models/ForumPost');
const Contest = require('../models/Contest');
const Notification = require('../models/Notification');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', [protect, admin], async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalAlumni: await User.countDocuments({ role: 'alumni' }),
      totalStudents: await User.countDocuments({ role: 'student' }),
      pendingApprovals: await User.countDocuments({ isApproved: false, role: 'alumni' }),
      totalJobs: await Job.countDocuments(),
      activeJobs: await Job.countDocuments({ status: 'active' }),
      totalEvents: await Event.countDocuments(),
      upcomingEvents: await Event.countDocuments({ status: 'published', startDate: { $gt: new Date() } }),
      totalForumPosts: await ForumPost.countDocuments(),
      totalContests: await Contest.countDocuments(),
      activeContests: await Contest.countDocuments({ status: 'ongoing' })
    };

    // Recent activities
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt isApproved');

    const recentJobs = await Job.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title company status createdAt');

    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title eventType status startDate');

    res.json({
      stats,
      recentActivities: {
        users: recentUsers,
        jobs: recentJobs,
        events: recentEvents
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', [protect, admin], async (req, res) => {
  try {
    const {
      role, status, isApproved, isVerified, q, page = 1, limit = 20, sort = 'newest'
    } = req.query;

    let query = {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Filters
    if (role) query.role = role;
    if (status) query.status = status;
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    // Search query
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { 'alumniInfo.company': { $regex: q, $options: 'i' } },
        { 'alumniInfo.industry': { $regex: q, $options: 'i' } }
      ];
    }

    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      case 'email':
        sortOption = { email: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOption);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Approve/reject alumni account
// @route   PUT /api/admin/users/:id/approval
// @access  Private (Admin only)
router.put('/users/:id/approval', [protect, admin], [
  body('isApproved').isBoolean().withMessage('Approval status is required'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be under 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isApproved, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'alumni') {
      return res.status(400).json({ message: 'Can only approve alumni accounts' });
    }

    user.isApproved = isApproved;
    user.approvedAt = isApproved ? new Date() : undefined;
    user.approvedBy = isApproved ? req.user.id : undefined;

    if (reason) {
      user.approvalNotes = reason;
    }

    await user.save();

    // Create notification for user
    await Notification.createNotification({
      recipient: user._id,
      sender: req.user.id,
      type: isApproved ? 'account_approved' : 'account_rejected',
      title: isApproved ? 'Account Approved' : 'Account Rejected',
      content: isApproved 
        ? 'Your alumni account has been approved. You can now access all features.'
        : `Your alumni account has been rejected: ${reason}`,
      relatedData: { userId: user._id }
    });

    res.json({ 
      message: `User ${isApproved ? 'approved' : 'rejected'} successfully`,
      user: user.toObject()
    });
  } catch (error) {
    console.error('Error updating user approval:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
router.put('/users/:id/role', [protect, admin], [
  body('role').isIn(['student', 'alumni', 'admin']).withMessage('Invalid role'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be under 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin' && req.user.id !== user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change admin role' });
    }

    const oldRole = user.role;
    user.role = role;

    // Reset role-specific fields when changing roles
    if (oldRole !== role) {
      if (role === 'alumni') {
        user.isApproved = false; // Require re-approval
        user.approvedAt = undefined;
        user.approvedBy = undefined;
      }
      user.studentInfo = {};
      user.alumniInfo = {};
    }

    if (reason) {
      user.roleChangeNotes = reason;
    }

    await user.save();

    // Create notification for user
    await Notification.createNotification({
      recipient: user._id,
      sender: req.user.id,
      type: 'role_changed',
      title: 'Role Changed',
      content: `Your role has been changed to ${role}`,
      relatedData: { userId: user._id }
    });

    res.json({ 
      message: 'User role updated successfully',
      user: user.toObject()
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Suspend/unsuspend user
// @route   PUT /api/admin/users/:id/suspend
// @access  Private (Admin only)
router.put('/users/:id/suspend', [protect, admin], [
  body('isSuspended').isBoolean().withMessage('Suspension status is required'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be under 500 characters'),
  body('duration').optional().isIn(['1_day', '3_days', '1_week', '1_month', 'permanent']).withMessage('Invalid suspension duration')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isSuspended, reason, duration } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot suspend admin users' });
    }

    user.isSuspended = isSuspended;
    user.suspendedAt = isSuspended ? new Date() : undefined;
    user.suspendedBy = isSuspended ? req.user.id : undefined;
    user.suspensionReason = reason;
    user.suspensionDuration = duration;

    if (duration && duration !== 'permanent') {
      const durationMap = {
        '1_day': 24 * 60 * 60 * 1000,
        '3_days': 3 * 24 * 60 * 60 * 1000,
        '1_week': 7 * 24 * 60 * 60 * 1000,
        '1_month': 30 * 24 * 60 * 60 * 1000
      };
      user.suspensionEndsAt = new Date(Date.now() + durationMap[duration]);
    } else if (duration === 'permanent') {
      user.suspensionEndsAt = undefined;
    }

    await user.save();

    // Create notification for user
    await Notification.createNotification({
      recipient: user._id,
      sender: req.user.id,
      type: isSuspended ? 'account_suspended' : 'account_unsuspended',
      title: isSuspended ? 'Account Suspended' : 'Account Unsuspended',
      content: isSuspended 
        ? `Your account has been suspended: ${reason}`
        : 'Your account has been unsuspended. You can now access all features.',
      relatedData: { userId: user._id }
    });

    res.json({ 
      message: `User ${isSuspended ? 'suspended' : 'unsuspended'} successfully`,
      user: user.toObject()
    });
  } catch (error) {
    console.error('Error updating user suspension:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get content moderation queue
// @route   GET /api/admin/moderation
// @access  Private (Admin only)
router.get('/moderation', [protect, admin], async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    // Get flagged content
    const flaggedJobs = await Job.find({ isFlagged: true })
      .populate('postedBy', 'name email role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ flaggedAt: -1 });

    const flaggedEvents = await Event.find({ isFlagged: true })
      .populate('organizer', 'name email role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ flaggedAt: -1 });

    const flaggedPosts = await ForumPost.find({ isFlagged: true })
      .populate('author', 'name email role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ flaggedAt: -1 });

    const flaggedContests = await Contest.find({ isFlagged: true })
      .populate('organizer', 'name email role')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ flaggedAt: -1 });

    const total = await Job.countDocuments({ isFlagged: true }) +
                  await Event.countDocuments({ isFlagged: true }) +
                  await ForumPost.countDocuments({ isFlagged: true }) +
                  await Contest.countDocuments({ isFlagged: true });

    res.json({
      flaggedContent: {
        jobs: flaggedJobs,
        events: flaggedEvents,
        posts: flaggedPosts,
        contests: flaggedContests
      },
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Moderate content
// @route   PUT /api/admin/moderate/:type/:id
// @access  Private (Admin only)
router.put('/moderate/:type/:id', [protect, admin], [
  body('action').isIn(['approve', 'reject', 'warn']).withMessage('Invalid moderation action'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be under 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, id } = req.params;
    const { action, reason } = req.body;

    let content;
    let contentType;

    switch (type) {
      case 'job':
        content = await Job.findById(id);
        contentType = 'Job';
        break;
      case 'event':
        content = await Event.findById(id);
        contentType = 'Event';
        break;
      case 'post':
        content = await ForumPost.findById(id);
        contentType = 'Forum Post';
        break;
      case 'contest':
        content = await Contest.findById(id);
        contentType = 'Contest';
        break;
      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }

    if (!content) {
      return res.status(404).json({ message: `${contentType} not found` });
    }

    // Apply moderation action
    switch (action) {
      case 'approve':
        content.isFlagged = false;
        content.moderatedBy = req.user.id;
        content.moderatedAt = new Date();
        content.moderationStatus = 'approved';
        break;
      case 'reject':
        content.isFlagged = false;
        content.moderatedBy = req.user.id;
        content.moderatedAt = new Date();
        content.moderationStatus = 'rejected';
        content.status = 'removed';
        break;
      case 'warn':
        content.isFlagged = false;
        content.moderatedBy = req.user.id;
        content.moderatedAt = new Date();
        content.moderationStatus = 'warned';
        break;
    }

    if (reason) {
      content.moderationReason = reason;
    }

    await content.save();

    // Create notification for content creator
    await Notification.createNotification({
      recipient: content.postedBy || content.organizer || content.author,
      sender: req.user.id,
      type: 'content_moderated',
      title: `${contentType} Moderated`,
      content: `Your ${contentType.toLowerCase()} has been ${action}${reason ? `: ${reason}` : ''}`,
      relatedData: {
        contentType: type,
        contentId: content._id
      }
    });

    res.json({ 
      message: `${contentType} ${action} successfully`,
      content
    });
  } catch (error) {
    console.error('Error moderating content:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get system analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
router.get('/analytics', [protect, admin], async (req, res) => {
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
      case '1_year':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const analytics = {
      userGrowth: {
        total: await User.countDocuments(),
        new: await User.countDocuments({ createdAt: { $gte: startDate } }),
        active: await User.countDocuments({ lastActive: { $gte: startDate } })
      },
      contentGrowth: {
        jobs: await Job.countDocuments({ createdAt: { $gte: startDate } }),
        events: await Event.countDocuments({ createdAt: { $gte: startDate } }),
        posts: await ForumPost.countDocuments({ createdAt: { $gte: startDate } }),
        contests: await Contest.countDocuments({ createdAt: { $gte: startDate } })
      },
      engagement: {
        totalConnections: await User.aggregate([
          { $group: { _id: null, total: { $sum: { $size: '$connections' } } } }
        ]).then(result => result[0]?.total || 0),
        totalMentorships: await require('../models/Mentorship').countDocuments(),
        totalMessages: await require('../models/Message').countDocuments()
      }
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Send system notification
// @route   POST /api/admin/notifications
// @access  Private (Admin only)
router.post('/notifications', [protect, admin], [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('content').trim().isLength({ min: 10, max: 1000 }).withMessage('Content must be 10-1000 characters'),
  body('type').isIn(['announcement', 'maintenance', 'update', 'warning']).withMessage('Invalid notification type'),
  body('recipients').isIn(['all', 'alumni', 'students', 'specific']).withMessage('Invalid recipient type'),
  body('specificUsers').optional().isArray().withMessage('Specific users must be an array'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title, content, type, recipients, specificUsers, priority = 'normal'
    } = req.body;

    let targetUsers = [];

    switch (recipients) {
      case 'all':
        targetUsers = await User.find({ isActive: true }).select('_id');
        break;
      case 'alumni':
        targetUsers = await User.find({ role: 'alumni', isActive: true }).select('_id');
        break;
      case 'students':
        targetUsers = await User.find({ role: 'student', isActive: true }).select('_id');
        break;
      case 'specific':
        if (!specificUsers || specificUsers.length === 0) {
          return res.status(400).json({ message: 'Specific users required when recipient type is specific' });
        }
        targetUsers = await User.find({ _id: { $in: specificUsers }, isActive: true }).select('_id');
        break;
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({ message: 'No target users found' });
    }

    // Create bulk notifications
    const notifications = targetUsers.map(user => ({
      recipient: user._id,
      sender: req.user.id,
      type: 'system_notification',
      title,
      content,
      priority,
      relatedData: { notificationType: type }
    }));

    await Notification.createBulkNotifications(notifications);

    res.json({ 
      message: `System notification sent to ${targetUsers.length} users`,
      sentCount: targetUsers.length
    });
  } catch (error) {
    console.error('Error sending system notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
