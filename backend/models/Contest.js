const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
  // Contest Details
  title: {
    type: String,
    required: [true, 'Contest title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Contest description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Organizer
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer is required']
  },
  
  // Contest Type
  contestType: {
    type: String,
    enum: ['practice', 'competitive', 'hackathon', 'algorithm', 'data-science', 'web-development'],
    default: 'competitive'
  },
  
  // Duration and Timing
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: 30,
    max: 1440 // 24 hours max
  },
  
  // Problems
  problems: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium'
    },
    points: {
      type: Number,
      required: true,
      min: 1
    },
    timeLimit: {
      type: Number, // in seconds
      default: 1000
    },
    memoryLimit: {
      type: Number, // in MB
      default: 256
    },
    testCases: [{
      input: {
        type: String,
        required: true
      },
      expectedOutput: {
        type: String,
        required: true
      },
      isHidden: {
        type: Boolean,
        default: false
      },
      description: String
    }],
    sampleInput: String,
    sampleOutput: String,
    constraints: [String],
    tags: [String],
    languages: [{
      type: String,
      enum: ['c', 'cpp', 'java', 'python', 'javascript', 'go', 'rust'],
      default: ['cpp', 'java', 'python']
    }]
  }],
  
  // Rules and Scoring
  rules: [String],
  scoringSystem: {
    type: String,
    enum: ['points-based', 'time-based', 'efficiency-based'],
    default: 'points-based'
  },
  penalty: {
    type: Number, // penalty per wrong submission
    default: 0
  },
  
  // Registration
  isRegistrationRequired: {
    type: Boolean,
    default: true
  },
  maxParticipants: {
    type: Number,
    min: 1
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  registrationDeadline: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  // Participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    startTime: Date,
    endTime: Date,
    totalScore: {
      type: Number,
      default: 0
    },
    totalTime: {
      type: Number, // in minutes
      default: 0
    },
    submissions: [{
      problem: {
        type: mongoose.Schema.Types.ObjectId
      },
      language: {
        type: String,
        required: true
      },
      code: {
        type: String,
        required: true
      },
      submittedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'running', 'accepted', 'wrong-answer', 'time-limit-exceeded', 'memory-limit-exceeded', 'runtime-error', 'compilation-error'],
        default: 'pending'
      },
      executionTime: Number, // in milliseconds
      memoryUsed: Number, // in MB
      score: Number,
      errorMessage: String,
      testCasesPassed: Number,
      totalTestCases: Number
    }]
  }],
  
  // Leaderboard
  leaderboard: [{
    rank: Number,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    totalScore: Number,
    totalTime: Number,
    problemsSolved: Number,
    lastSubmission: Date
  }],
  
  // Prizes
  prizes: [{
    rank: Number,
    description: String,
    value: Number,
    currency: String
  }],
  
  // Additional Features
  isPublic: {
    type: Boolean,
    default: true
  },
  allowPractice: {
    type: Boolean,
    default: false
  },
  showLeaderboard: {
    type: Boolean,
    default: true
  },
  
  // Statistics
  totalSubmissions: {
    type: Number,
    default: 0
  },
  totalAccepted: {
    type: Number,
    default: 0
  },
  
  // Tags and Categories
  tags: [String],
  category: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
contestSchema.index({ title: 'text', description: 'text' });
contestSchema.index({ status: 1, startDate: 1 });
contestSchema.index({ organizer: 1 });
contestSchema.index({ contestType: 1 });
contestSchema.index({ category: 1 });
contestSchema.index({ 'participants.user': 1 });
contestSchema.index({ 'problems.difficulty': 1 });

// Virtual for isUpcoming
contestSchema.virtual('isUpcoming').get(function() {
  return this.startDate > new Date();
});

// Virtual for isOngoing
contestSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
});

// Virtual for isPast
contestSchema.virtual('isPast').get(function() {
  return this.endDate < new Date();
});

// Virtual for canRegister
contestSchema.virtual('canRegister').get(function() {
  if (!this.isRegistrationRequired) return false;
  if (this.maxParticipants && this.currentParticipants >= this.maxParticipants) return false;
  if (this.registrationDeadline && new Date() > this.registrationDeadline) return false;
  return this.status === 'upcoming';
});

// Virtual for timeUntilStart
contestSchema.virtual('timeUntilStart').get(function() {
  const now = new Date();
  const diff = this.startDate - now;
  if (diff <= 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return 'Less than 1 hour';
});

// Pre-save middleware to update status based on dates
contestSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.startDate <= now && this.endDate >= now) {
    this.status = 'ongoing';
  } else if (this.endDate < now) {
    this.status = 'completed';
  }
  
  next();
});

// Method to register participant
contestSchema.methods.registerParticipant = function(userId) {
  if (!this.canRegister) {
    throw new Error('Cannot register for this contest');
  }
  
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    throw new Error('User already registered');
  }
  
  this.participants.push({ user: userId });
  this.currentParticipants += 1;
  return this.save();
};

// Method to unregister participant
contestSchema.methods.unregisterParticipant = function(userId) {
  const participantIndex = this.participants.findIndex(
    p => p.user.toString() === userId.toString()
  );
  
  if (participantIndex === -1) {
    throw new Error('User not registered');
  }
  
  this.participants.splice(participantIndex, 1);
  this.currentParticipants -= 1;
  return this.save();
};

// Method to add submission
contestSchema.methods.addSubmission = function(userId, problemIndex, language, code) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('User not registered for this contest');
  }
  
  if (!this.isOngoing) {
    throw new Error('Contest is not ongoing');
  }
  
  const submission = {
    problem: problemIndex,
    language: language,
    code: code,
    submittedAt: new Date()
  };
  
  participant.submissions.push(submission);
  this.totalSubmissions += 1;
  
  return this.save();
};

// Method to update submission status
contestSchema.methods.updateSubmissionStatus = function(userId, submissionId, status, result) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('User not registered for this contest');
  }
  
  const submission = participant.submissions.id(submissionId);
  if (!submission) {
    throw new Error('Submission not found');
  }
  
  submission.status = status;
  
  if (result) {
    submission.executionTime = result.executionTime;
    submission.memoryUsed = result.memoryUsed;
    submission.score = result.score;
    submission.errorMessage = result.errorMessage;
    submission.testCasesPassed = result.testCasesPassed;
    submission.totalTestCases = result.totalTestCases;
    
    if (status === 'accepted') {
      this.totalAccepted += 1;
    }
  }
  
  return this.save();
};

// Method to update leaderboard
contestSchema.methods.updateLeaderboard = function() {
  const participants = this.participants.map(p => ({
    user: p.user,
    totalScore: p.totalScore || 0,
    totalTime: p.totalTime || 0,
    problemsSolved: p.submissions.filter(s => s.status === 'accepted').length,
    lastSubmission: p.submissions.length > 0 ? 
      Math.max(...p.submissions.map(s => s.submittedAt)) : null
  }));
  
  // Sort by score (descending), then by time (ascending)
  participants.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return (a.totalTime || 0) - (b.totalTime || 0);
  });
  
  // Assign ranks
  this.leaderboard = participants.map((p, index) => ({
    ...p,
    rank: index + 1
  }));
  
  return this.save();
};

// Method to start contest for participant
contestSchema.methods.startContest = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('User not registered for this contest');
  }
  
  if (!this.isOngoing) {
    throw new Error('Contest is not ongoing');
  }
  
  if (participant.startTime) {
    throw new Error('Contest already started for this participant');
  }
  
  participant.startTime = new Date();
  return this.save();
};

// Method to end contest for participant
contestSchema.methods.endContest = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('User not registered for this contest');
  }
  
  if (!participant.startTime) {
    throw new Error('Contest not started for this participant');
  }
  
  participant.endTime = new Date();
  participant.totalTime = Math.floor((participant.endTime - participant.startTime) / (1000 * 60));
  
  return this.save();
};

// Method to publish contest
contestSchema.methods.publish = function() {
  this.status = 'upcoming';
  return this.save();
};

// Method to cancel contest
contestSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Static method to find upcoming contests
contestSchema.statics.findUpcoming = function() {
  return this.find({
    status: 'upcoming'
  }).sort({ startDate: 1 });
};

// Static method to find ongoing contests
contestSchema.statics.findOngoing = function() {
  return this.find({
    status: 'ongoing'
  }).sort({ endDate: 1 });
};

// Static method to find contests by type
contestSchema.statics.findByType = function(contestType) {
  return this.find({
    contestType: contestType,
    status: { $in: ['upcoming', 'ongoing'] }
  }).sort({ startDate: 1 });
};

module.exports = mongoose.model('Contest', contestSchema);
