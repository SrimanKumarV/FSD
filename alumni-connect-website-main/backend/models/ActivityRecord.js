const mongoose = require('mongoose');

const activityRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivityGoal',
    default: null
  },
  // For platform-based records (auto-detected)
  platform: {
    type: String,
    enum: ['leetcode', 'github', 'duolingo', 'hackerrank', 'codechef', 'codeforces', 'gfg', 'kaggle', 'custom'],
    default: 'custom'
  },
  // The date this record is for (YYYY-MM-DD in user's timezone)
  date: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  // How the completion was detected
  completionType: {
    type: String,
    enum: ['manual', 'auto-detected', 'api-verified'],
    default: 'manual'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters'],
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Prevent duplicate records for the same goal on the same day
activityRecordSchema.index({ userId: 1, goalId: 1, date: 1 }, { unique: true, sparse: true });
activityRecordSchema.index({ userId: 1, date: 1 });
activityRecordSchema.index({ userId: 1, platform: 1, date: 1 });

module.exports = mongoose.model('ActivityRecord', activityRecordSchema);
