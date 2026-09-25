const mongoose = require('mongoose');

const activityGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  category: {
    type: String,
    enum: ['coding', 'learning', 'career', 'project', 'custom'],
    default: 'custom'
  },
  platform: {
    type: String,
    enum: ['leetcode', 'github', 'duolingo', 'hackerrank', 'codechef', 'codeforces', 'gfg', 'kaggle', 'custom'],
    default: 'custom'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekdays', 'custom'],
    default: 'daily'
  },
  customDays: {
    type: [Number], // 0=Sun, 1=Mon, ..., 6=Sat
    default: [1, 2, 3, 4, 5] // Mon-Fri
  },
  target: {
    type: String,
    trim: true,
    maxlength: [100, 'Target description cannot exceed 100 characters'],
    default: ''
  },
  reminderTime: {
    type: String, // HH:mm format in user's timezone
    default: '20:00'
  },
  emailEnabled: {
    type: Boolean,
    default: true
  },
  inAppEnabled: {
    type: Boolean,
    default: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  // Streak tracking for this goal
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  lastCompletedAt: {
    type: Date,
    default: null
  },
  totalCompletions: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate goals with same title per user
activityGoalSchema.index({ userId: 1, title: 1 });
activityGoalSchema.index({ userId: 1, platform: 1 });
activityGoalSchema.index({ enabled: 1, frequency: 1 });

module.exports = mongoose.model('ActivityGoal', activityGoalSchema);
