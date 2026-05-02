const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  
  // Sender (optional - for notifications from other users)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Notification Type
  type: {
    type: String,
    enum: [
      'mentorship-request',
      'mentorship-accepted',
      'mentorship-rejected',
      'job-posted',
      'event-reminder',
      'event-registration',
      'forum-reply',
      'forum-like',
      'contest-reminder',
      'contest-result',
      'connection-request',
      'connection-accepted',
      'message-received',
      'profile-view',
      'system-announcement',
      'admin-approval',
      'admin-rejection'
    ],
    required: [true, 'Notification type is required']
  },
  
  // Title and Content
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Notification content is required'],
    maxlength: [500, 'Content cannot exceed 500 characters']
  },
  
  // Related Data
  relatedData: {
    // For mentorship notifications
    mentorshipId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentorship'
    },
    
    // For job notifications
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    
    // For event notifications
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    
    // For forum notifications
    forumPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForumPost'
    },
    
    // For contest notifications
    contestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contest'
    },
    
    // For message notifications
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    
    // For connection notifications
    connectionUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Generic data
    data: mongoose.Schema.Types.Mixed
  },
  
  // Notification Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Read Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Action Required
  requiresAction: {
    type: Boolean,
    default: false
  },
  actionType: {
    type: String,
    enum: ['accept', 'reject', 'view', 'reply', 'register', 'apply', 'none'],
    default: 'none'
  },
  actionUrl: String,
  
  // Delivery Status
  deliveryStatus: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  
  // Delivery Methods
  deliveryMethods: [{
    type: String,
    enum: ['in-app', 'email', 'push', 'sms'],
    default: ['in-app']
  }],
  
  // Email Status
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  
  // Push Notification Status
  pushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: Date,
  
  // Expiration
  expiresAt: Date,
  isExpired: {
    type: Boolean,
    default: false
  },
  
  // Grouping (for similar notifications)
  groupId: String,
  
  // Metadata
  metadata: {
    source: String, // 'system', 'user', 'admin'
    category: String,
    tags: [String]
  }
}, {
  timestamps: true
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ 'relatedData.mentorshipId': 1 });
notificationSchema.index({ 'relatedData.jobId': 1 });
notificationSchema.index({ 'relatedData.eventId': 1 });
notificationSchema.index({ 'relatedData.forumPostId': 1 });
notificationSchema.index({ 'relatedData.contestId': 1 });
notificationSchema.index({ 'relatedData.messageId': 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ groupId: 1 });

// Virtual for isExpiredStatus
notificationSchema.virtual('isExpiredStatus').get(function() {
  if (this.expiresAt) {
    return new Date() > this.expiresAt;
  }
  return false;
});

// Virtual for isActionable
notificationSchema.virtual('isActionable').get(function() {
  return this.requiresAction && this.actionType !== 'none';
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return this;
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  if (this.isRead) {
    this.isRead = false;
    this.readAt = undefined;
    return this.save();
  }
  return this;
};

// Method to mark email as sent
notificationSchema.methods.markEmailSent = function() {
  this.emailSent = true;
  this.emailSentAt = new Date();
  this.deliveryStatus = 'sent';
  return this.save();
};

// Method to mark push as sent
notificationSchema.methods.markPushSent = function() {
  this.pushSent = true;
  this.pushSentAt = new Date();
  this.deliveryStatus = 'sent';
  return this.save();
};

// Method to mark as delivered
notificationSchema.methods.markAsDelivered = function() {
  this.deliveryStatus = 'delivered';
  return this.save();
};

// Method to mark as failed
notificationSchema.methods.markAsFailed = function() {
  this.deliveryStatus = 'failed';
  return this.save();
};

// Method to expire notification
notificationSchema.methods.expire = function() {
  this.isExpired = true;
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = function(data) {
  const notification = new this(data);
  
  // Set default expiration (30 days from now)
  if (!notification.expiresAt) {
    notification.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  
  return notification.save();
};

// Static method to find unread notifications for user
notificationSchema.statics.findUnreadForUser = function(userId, page = 1, limit = 20) {
  return this.find({
    recipient: userId,
    isRead: false,
    isExpired: false
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name photo role')
    .populate('relatedData.mentorshipId')
    .populate('relatedData.jobId')
    .populate('relatedData.eventId')
    .populate('relatedData.forumPostId')
    .populate('relatedData.contestId')
    .populate('relatedData.messageId')
    .populate('relatedData.connectionUserId', 'name photo role');
};

// Static method to find all notifications for user
notificationSchema.statics.findAllForUser = function(userId, page = 1, limit = 20) {
  return this.find({
    recipient: userId,
    isExpired: false
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name photo role')
    .populate('relatedData.mentorshipId')
    .populate('relatedData.jobId')
    .populate('relatedData.eventId')
    .populate('relatedData.forumPostId')
    .populate('relatedData.contestId')
    .populate('relatedData.messageId')
    .populate('relatedData.connectionUserId', 'name photo role');
};

// Static method to mark all notifications as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      isRead: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  );
};

// Static method to delete expired notifications
notificationSchema.statics.deleteExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

// Static method to find notifications by type
notificationSchema.statics.findByType = function(userId, type, page = 1, limit = 20) {
  return this.find({
    recipient: userId,
    type: type,
    isExpired: false
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name photo role');
};

// Static method to find actionable notifications
notificationSchema.statics.findActionable = function(userId) {
  return this.find({
    recipient: userId,
    requiresAction: true,
    isRead: false,
    isExpired: false
  })
    .sort({ priority: -1, createdAt: -1 })
    .populate('sender', 'name photo role');
};

// Static method to get notification count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    isExpired: false
  });
};

// Static method to get notification count by type
notificationSchema.statics.getUnreadCountByType = function(userId, type) {
  return this.countDocuments({
    recipient: userId,
    type: type,
    isRead: false,
    isExpired: false
  });
};

// Static method to create system notification
notificationSchema.statics.createSystemNotification = function(recipients, title, content, metadata = {}) {
  const notifications = recipients.map(recipientId => ({
    recipient: recipientId,
    type: 'system-announcement',
    title,
    content,
    metadata: {
      ...metadata,
      source: 'system'
    },
    priority: 'normal',
    requiresAction: false,
    actionType: 'none'
  }));
  
  return this.insertMany(notifications);
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = function(notifications) {
  return this.insertMany(notifications);
};

module.exports = mongoose.model('Notification', notificationSchema);
