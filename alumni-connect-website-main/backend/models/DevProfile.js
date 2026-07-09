const mongoose = require('mongoose');

const devProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  usernames: {
    github: { type: String, trim: true, default: '' },
    leetcode: { type: String, trim: true, default: '' },
    hackerrank: { type: String, trim: true, default: '' },
    gfg: { type: String, trim: true, default: '' }
  },
  stats: {
    github: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    leetcode: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    hackerrank: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    gfg: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  lastUpdated: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DevProfile', devProfileSchema);
