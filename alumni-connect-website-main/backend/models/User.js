const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'alumni', 'admin'],
    required: [true, 'Role is required'],
    default: 'student'
  },
  
  // Profile Information
  photo: {
    type: String,
    default: 'default-avatar.png'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  skills: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    trim: true
  },
  
  // Student-specific fields
  studentInfo: {
    course: {
      type: String,
      trim: true
    },
    year: {
      type: Number,
      min: 1,
      max: 5
    },
    university: {
      type: String,
      trim: true
    }
  },
  
  // Alumni-specific fields
  alumniInfo: {
    graduationYear: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear()
    },
    company: {
      type: String,
      trim: true
    },
    position: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    experience: {
      type: Number,
      min: 0
    },
    availableForMentorship: {
      type: Boolean,
      default: false
    },
    mentorshipAreas: [{
      type: String,
      trim: true
    }]
  },
  
  // Social Links
  socialLinks: {
    linkedin: String,
    github: String,
    twitter: String,
    website: String
  },
  
  // Account Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Statistics
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Timestamps
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'alumniInfo.industry': 1 });
userSchema.index({ 'alumniInfo.company': 1 });
userSchema.index({ skills: 1 });
userSchema.index({ location: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Get public profile (without sensitive information)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for isOnline
userSchema.virtual('isOnline').get(function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastActive > fiveMinutesAgo;
});

module.exports = mongoose.model('User', userSchema);
