const mongoose = require('mongoose');

const adminIncidentSchema = new mongoose.Schema({
  incidentCode: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'acknowledged', 'investigating', 'mitigated', 'resolved', 'ignored'],
    default: 'open',
    index: true
  },
  provider: {
    type: String,
    required: true,
    index: true
  },
  operation: {
    type: String,
    default: 'unknown',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  adminMessage: {
    type: String,
    required: true
  },
  recommendedAction: {
    type: String,
    default: ''
  },
  httpStatus: {
    type: Number,
    default: 500
  },
  providerErrorCode: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  providerReason: {
    type: String,
    default: null
  },
  retryable: {
    type: Boolean,
    default: false
  },
  requiresAdminAction: {
    type: Boolean,
    default: true
  },
  requiresReauth: {
    type: Boolean,
    default: false
  },
  firstSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  occurrences: {
    type: Number,
    default: 1
  },
  affectedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  affectedUserCount: {
    type: Number,
    default: 0
  },
  correlationIds: [{
    type: String
  }],
  technicalDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  notes: [{
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    adminName: String,
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionNotes: {
    type: String
  },
  resolvedAutomatically: {
    type: Boolean,
    default: false
  },
  durationMinutes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

adminIncidentSchema.index({ status: 1, severity: 1, lastSeen: -1 });
adminIncidentSchema.index({ provider: 1, incidentCode: 1, status: 1 });

module.exports = mongoose.model('AdminIncident', adminIncidentSchema);
