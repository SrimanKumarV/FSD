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
  phoneNumber: {
    type: String,
    trim: true
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'alumni', 'admin', 'college'],
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
  interests: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    default: ''
  },
  college: {
    type: String,
    trim: true,
    default: ''
  },
  department: {
    type: String,
    trim: true,
    default: ''
  },

  // Student-specific fields
  studentInfo: {
    course: {
      type: String,
      trim: true
    },
    year: {
      type: Number
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
      max: new Date().getFullYear() + 5
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
    studentsPlaced: {
      type: Number,
      default: 0
    },
    employmentProofUrl: {
      type: String,
      trim: true
    },
    adminVerifiedMentor: {
      type: Boolean,
      default: false
    },
    availableForMentorship: {
      type: Boolean,
      default: false
    },
    mentorshipAreas: [{
      type: String,
      trim: true
    }],
    maxMentees: {
      type: Number,
      default: 5
    },
    preferredBatches: [{
      type: String,
      trim: true
    }],
    mentorRating: {
      type: Number,
      default: 0
    },
    mentorReviewCount: {
      type: Number,
      default: 0
    },
    mentorshipHours: {
      type: Number,
      default: 0
    }
  },

  // College-specific fields
  collegeInfo: {
    establishedYear: {
      type: Number,
      min: 1000,
      max: new Date().getFullYear()
    },
    accreditation: {
      type: String,
      trim: true
    },
    officialUrl: {
      type: String,
      trim: true
    },
    extractedProfile: {
      aboutUs: String,
      mission: String,
      vision: String,
      contactEmail: String,
      contactPhone: String,
      address: String,
      departments: [String],
      programs: {
        ug: [String],
        pg: [String],
        phd: [String]
      },
      clubsAndCells: [String],
      facilities: [String],
      placements: {
        highestPackage: String,
        averagePackage: String,
        topCompanies: [String]
      },
      upcomingEvents: [
        {
          title: String,
          date: String,
          description: String
        }
      ],
      lastExtractedAt: Date
    },
    websiteMetadata: {
      title: String,
      description: String,
      image: String
    }
  },

  // Social Links
  socialLinks: {
    linkedin: String,
    github: String,
    twitter: String,
    website: String,
    portfolio: String,
    codeforces: String,
    leetcode: String,
    codolio: String
  },

  // Rewards & Gamification
  rewardPoints: {
    type: Number,
    default: 0
  },

  // Email Preferences
  emailPreferences: {
    networkUpdates: {
      type: Boolean,
      default: true
    },
    devPulse: {
      type: Boolean,
      default: true
    },
    weeklyDigest: {
      type: Boolean,
      default: true
    }
  },

  // Account Status
  status: {
    type: String,
    enum: ['available', 'busy'],
    default: 'available'
  },
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
  followRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Timestamps
  lastActive: {
    type: Date,
    default: Date.now
  },
  lastEngagementEmailSent: {
    type: Date
  },

  // Tasks completed by the user
  completedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],

  // Forum interactions
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumPost'
  }],
  reportedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ForumPost'
  }],

  // Password Reset
  resetPasswordOtp: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
  resetPasswordOtpAttempts: { type: Number, default: 0, select: false },

  // Email Verification OTP
  verificationOtp: { type: String, select: false },
  verificationOtpExpires: { type: Date, select: false },
  verificationOtpAttempts: { type: Number, default: 0, select: false },

  // Account Deletion OTP
  deleteAccountOtp: { type: String, select: false },
  deleteAccountExpires: { type: Date, select: false },
  deleteAccountOtpAttempts: { type: Number, default: 0, select: false },

  // 2FA OTP & Security fields
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorOtp: { type: String, select: false },
  twoFactorOtpExpires: { type: Date, select: false },
  twoFactorOtpAttempts: { type: Number, default: 0, select: false }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ 'alumniInfo.company': 1 });
userSchema.index({ skills: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
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
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last active timestamp
userSchema.methods.updateLastActive = function () {
  this.lastActive = new Date();
  return this.constructor.updateOne(
    { _id: this._id },
    { $set: { lastActive: this.lastActive } }
  );
};

// Get public profile using an explicit allowlist of safe fields
userSchema.methods.getPublicProfile = function () {
  const alumni = this.alumniInfo ? {
    graduationYear: this.alumniInfo.graduationYear,
    company: this.alumniInfo.company,
    position: this.alumniInfo.position,
    industry: this.alumniInfo.industry,
    experience: this.alumniInfo.experience,
    studentsPlaced: this.alumniInfo.studentsPlaced,
    adminVerifiedMentor: this.alumniInfo.adminVerifiedMentor,
    availableForMentorship: this.alumniInfo.availableForMentorship,
    mentorshipAreas: this.alumniInfo.mentorshipAreas || [],
    maxMentees: this.alumniInfo.maxMentees,
    preferredBatches: this.alumniInfo.preferredBatches || [],
    mentorRating: this.alumniInfo.mentorRating,
    mentorReviewCount: this.alumniInfo.mentorReviewCount,
    mentorshipHours: this.alumniInfo.mentorshipHours
    // employmentProofUrl is private verification evidence and strictly excluded from public profiles
  } : undefined;

  const student = this.studentInfo ? {
    course: this.studentInfo.course,
    year: this.studentInfo.year,
    university: this.studentInfo.university
  } : undefined;

  const college = this.collegeInfo ? {
    establishedYear: this.collegeInfo.establishedYear,
    accreditation: this.collegeInfo.accreditation,
    officialUrl: this.collegeInfo.officialUrl,
    extractedProfile: this.collegeInfo.extractedProfile,
    websiteMetadata: this.collegeInfo.websiteMetadata
  } : undefined;

  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    photo: this.photo,
    bio: this.bio,
    skills: this.skills || [],
    interests: this.interests || [],
    location: this.location,
    country: this.country,
    college: this.college,
    department: this.department,
    studentInfo: student,
    alumniInfo: alumni,
    collegeInfo: college,
    socialLinks: this.socialLinks || {},
    rewardPoints: this.rewardPoints || 0,
    status: this.status,
    isVerified: this.isVerified,
    isApproved: this.isApproved,
    isActive: this.isActive,
    connections: this.connections || [],
    followers: this.followers || [],
    following: this.following || [],
    lastActive: this.lastActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Get authenticated private profile for the account owner (includes preferences and contact info, strips secrets)
userSchema.methods.getPrivateProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.resetPasswordOtp;
  delete userObject.resetPasswordExpires;
  delete userObject.resetPasswordOtpAttempts;
  delete userObject.verificationOtp;
  delete userObject.verificationOtpExpires;
  delete userObject.verificationOtpAttempts;
  delete userObject.deleteAccountOtp;
  delete userObject.deleteAccountExpires;
  delete userObject.deleteAccountOtpAttempts;
  delete userObject.twoFactorOtp;
  delete userObject.twoFactorOtpExpires;
  delete userObject.twoFactorOtpAttempts;
  delete userObject.__v;
  return userObject;
};

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return this.name;
});

// Virtual for isOnline
userSchema.virtual('isOnline').get(function () {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastActive > fiveMinutesAgo;
});

// Indexes for faster queries
userSchema.index({ role: 1, status: 1 });
userSchema.index({ 'alumniInfo.industry': 1 });
userSchema.index({ location: 1 });

// Cascade delete related documents when user is deleted
userSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  try {
    const userId = this._id;

    // Delete all forum posts authored by user
    await mongoose.model('ForumPost').deleteMany({ author: userId });

    // Remove user from likes and comments in other posts
    await mongoose.model('ForumPost').updateMany({}, {
      $pull: {
        likes: userId,
        dislikes: userId,
        comments: { author: userId }
      }
    });

    // Delete messages
    await mongoose.model('Message').deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });

    // Delete mentorships
    await mongoose.model('Mentorship').deleteMany({ $or: [{ mentor: userId }, { student: userId }] });

    // Delete notifications
    await mongoose.model('Notification').deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });

    // Delete jobs posted by user
    await mongoose.model('Job').deleteMany({ postedBy: userId });

    // Remove user from all connections/followers arrays across all other users
    await mongoose.model('User').updateMany({}, {
      $pull: {
        connections: userId,
        followers: userId,
        following: userId,
        followRequests: userId
      }
    });

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
