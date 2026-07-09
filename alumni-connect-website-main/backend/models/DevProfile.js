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
    github: { 
      username: { type: String, trim: true, default: '' },
      isVerified: { type: Boolean, default: false }
    },
    leetcode: { 
      username: { type: String, trim: true, default: '' },
      isVerified: { type: Boolean, default: false }
    },
    hackerrank: { 
      username: { type: String, trim: true, default: '' },
      isVerified: { type: Boolean, default: false }
    },
    gfg: { 
      username: { type: String, trim: true, default: '' },
      isVerified: { type: Boolean, default: false }
    }
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
  },
  alumnexScore: {
    type: Number,
    default: 0
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DevProfile', devProfileSchema);
