const mongoose = require('mongoose');

const reminderPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  // Master switches
  emailEnabled: {
    type: Boolean,
    default: true
  },
  inAppEnabled: {
    type: Boolean,
    default: true
  },

  // Notification types
  dailyReminder: {
    type: Boolean,
    default: true
  },
  streakAlert: {
    type: Boolean,
    default: true
  },
  milestoneAlert: {
    type: Boolean,
    default: true
  },
  weeklySummary: {
    type: Boolean,
    default: true
  },
  platformUpdates: {
    type: Boolean,
    default: false
  },

  // Schedule
  reminderTime: {
    type: String, // HH:mm format
    default: '20:00'
  },

  // Quiet hours
  quietHoursEnabled: {
    type: Boolean,
    default: true
  },
  quietHoursStart: {
    type: String, // HH:mm format
    default: '22:00'
  },
  quietHoursEnd: {
    type: String, // HH:mm format
    default: '07:00'
  },

  // Timezone
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },

  // Frequency
  reminderDays: {
    type: [Number], // 0=Sun, 1=Mon, ..., 6=Sat
    default: [1, 2, 3, 4, 5] // Mon-Fri by default
  },

  // Anti-spam: track last notification sent per type
  lastDailyReminderSent: {
    type: Date,
    default: null
  },
  lastWeeklySummarySent: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReminderPreference', reminderPreferenceSchema);
