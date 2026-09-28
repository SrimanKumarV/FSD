const mongoose = require('mongoose');

const notificationDeviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['web', 'android', 'ios'],
    required: true,
    default: 'web'
  },
  pushProvider: {
    type: String,
    enum: ['web-push', 'fcm', 'local'],
    required: true,
    default: 'web-push'
  },
  subscription: {
    endpoint: { type: String, trim: true },
    keys: {
      p256dh: { type: String, trim: true },
      auth: { type: String, trim: true }
    }
  },
  pushToken: {
    type: String,
    trim: true
  },
  deviceId: {
    type: String,
    required: true,
    trim: true
  },
  deviceName: {
    type: String,
    trim: true,
    default: 'Device'
  },
  browser: {
    type: String,
    trim: true
  },
  appVersion: {
    type: String,
    trim: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  permission: {
    type: String,
    enum: ['granted', 'denied', 'default', 'prompt', 'unknown'],
    default: 'granted'
  },
  lastSeenAt: {
    type: Date,
    default: Date.now
  },
  lastDeliveryAt: {
    type: Date
  },
  lastDeliveryStatus: {
    type: String,
    enum: ['success', 'failed', 'simulated', 'expired', 'none'],
    default: 'none'
  },
  lastError: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound unique index ensuring one record per user + deviceId + platform
notificationDeviceSchema.index({ userId: 1, deviceId: 1, platform: 1 }, { unique: true });
notificationDeviceSchema.index({ 'subscription.endpoint': 1 });
notificationDeviceSchema.index({ pushToken: 1 });
notificationDeviceSchema.index({ userId: 1, enabled: 1 });

module.exports = mongoose.model('NotificationDevice', notificationDeviceSchema);
