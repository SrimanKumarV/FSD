const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const watchChannelSchema = new mongoose.Schema({
  channelId: { type: String, required: true },
  resourceId: { type: String, required: true },
  expiration: { type: Date, required: true },
  calendarId: { type: String, default: 'primary' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const googleCalendarConnectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  googleAccountEmail: {
    type: String,
    trim: true,
    lowercase: true,
    index: true
  },
  googleUserId: {
    type: String,
    trim: true,
    index: true
  },
  accessToken: {
    type: String,
    select: false // NEVER return in queries by default
  },
  refreshToken: {
    type: String,
    select: false // NEVER return in queries by default
  },
  tokenExpiry: {
    type: Date
  },
  scopes: [{
    type: String
  }],
  primaryCalendarId: {
    type: String,
    default: 'primary'
  },
  selectedCalendarIds: [{
    type: String
  }],
  timezone: {
    type: String,
    default: 'UTC'
  },
  syncEnabled: {
    type: Boolean,
    default: true
  },
  pushNotificationsEnabled: {
    type: Boolean,
    default: true
  },
  lastSyncedAt: {
    type: Date
  },
  lastSuccessfulSyncAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['connected', 'syncing', 'error', 'reauthorization_required', 'disconnected'],
    default: 'connected',
    index: true
  },
  lastError: {
    message: String,
    code: String,
    timestamp: Date
  },
  watchChannels: [watchChannelSchema],
  syncTokens: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for fast lookup
googleCalendarConnectionSchema.index({ userId: 1, status: 1 });
googleCalendarConnectionSchema.index({ 'watchChannels.channelId': 1 });

/**
 * Encrypt tokens before saving
 */
googleCalendarConnectionSchema.pre('save', function (next) {
  if (this.isModified('accessToken') && this.accessToken) {
    if (!this.accessToken.includes(':')) {
      this.accessToken = encrypt(this.accessToken);
    }
  }
  if (this.isModified('refreshToken') && this.refreshToken) {
    if (!this.refreshToken.includes(':')) {
      this.refreshToken = encrypt(this.refreshToken);
    }
  }
  next();
});

/**
 * Returns decrypted tokens securely. Must be called on an instance
 * where accessToken and refreshToken were explicitly selected (+accessToken +refreshToken).
 */
googleCalendarConnectionSchema.methods.getDecryptedTokens = function () {
  return {
    accessToken: this.accessToken ? decrypt(this.accessToken) : null,
    refreshToken: this.refreshToken ? decrypt(this.refreshToken) : null
  };
};

/**
 * Safe public profile representation that never exposes tokens
 */
googleCalendarConnectionSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    userId: this.userId,
    googleAccountEmail: this.googleAccountEmail,
    googleUserId: this.googleUserId,
    scopes: this.scopes,
    primaryCalendarId: this.primaryCalendarId,
    selectedCalendarIds: this.selectedCalendarIds || [],
    timezone: this.timezone,
    syncEnabled: this.syncEnabled,
    pushNotificationsEnabled: this.pushNotificationsEnabled,
    lastSyncedAt: this.lastSyncedAt,
    lastSuccessfulSyncAt: this.lastSuccessfulSyncAt,
    status: this.status,
    lastError: this.lastError,
    watchChannelsActive: (this.watchChannels || []).length,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('GoogleCalendarConnection', googleCalendarConnectionSchema);
