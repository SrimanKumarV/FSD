const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
  // Mentorship Request Details
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mentor is required']
  },
  
  // Request Information
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Mentorship Details
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Areas of Focus
  focusAreas: [{
    type: String,
    trim: true,
    required: [true, 'At least one focus area is required']
  }],
  
  // Goals and Objectives
  goals: [{
    type: String,
    trim: true
  }],
  
  // Timeline
  startDate: {
    type: Date,
    default: Date.now
  },
  expectedDuration: {
    type: Number, // in weeks
    min: 1,
    max: 52
  },
  endDate: {
    type: Date
  },
  
  // Meeting Schedule
  meetingSchedule: {
    frequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly', 'as-needed'],
      default: 'weekly'
    },
    preferredTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'flexible'],
      default: 'flexible'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Communication Preferences
  communicationMethod: [{
    type: String,
    enum: ['video-call', 'voice-call', 'chat', 'email'],
    default: ['video-call', 'chat']
  }],
  
  // Progress Tracking
  progress: {
    currentPhase: {
      type: String,
      default: 'initial'
    },
    milestones: [{
      title: String,
      description: String,
      completed: {
        type: Boolean,
        default: false
      },
      completedDate: Date
    }],
    notes: [{
      content: String,
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Feedback and Ratings
  feedback: {
    studentRating: {
      type: Number,
      min: 1,
      max: 5
    },
    studentReview: String,
    mentorRating: {
      type: Number,
      min: 1,
      max: 5
    },
    mentorReview: String,
    submittedAt: Date
  },
  
  // Status Updates
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled']
    },
    reason: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Cancellation/Rejection Details
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Tags for categorization
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better performance
mentorshipSchema.index({ student: 1, status: 1 });
mentorshipSchema.index({ mentor: 1, status: 1 });
mentorshipSchema.index({ status: 1 });
mentorshipSchema.index({ focusAreas: 1 });
mentorshipSchema.index({ createdAt: -1 });

// Virtual for mentorship duration
mentorshipSchema.virtual('duration').get(function() {
  if (this.endDate && this.startDate) {
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24 * 7));
  }
  return null;
});

// Virtual for isActive
mentorshipSchema.virtual('isActive').get(function() {
  return ['pending', 'accepted'].includes(this.status);
});

// Virtual for isCompleted
mentorshipSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Pre-save middleware to update status history
mentorshipSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      updatedBy: this.mentor, // Default to mentor, can be updated in controller
      timestamp: new Date()
    });
  }
  next();
});

// Method to update status
mentorshipSchema.methods.updateStatus = function(newStatus, reason, updatedBy) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    reason: reason || '',
    updatedBy: updatedBy,
    timestamp: new Date()
  });
  
  if (newStatus === 'cancelled') {
    this.cancelledBy = updatedBy;
  }
  
  return this.save();
};

// Method to add milestone
mentorshipSchema.methods.addMilestone = function(title, description) {
  this.progress.milestones.push({
    title,
    description,
    completed: false
  });
  return this.save();
};

// Method to complete milestone
mentorshipSchema.methods.completeMilestone = function(milestoneId) {
  const milestone = this.progress.milestones.id(milestoneId);
  if (milestone) {
    milestone.completed = true;
    milestone.completedDate = new Date();
    return this.save();
  }
  throw new Error('Milestone not found');
};

// Method to add note
mentorshipSchema.methods.addNote = function(content, author) {
  this.progress.notes.push({
    content,
    author,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to find active mentorships
mentorshipSchema.statics.findActive = function() {
  return this.find({ status: { $in: ['pending', 'accepted'] } });
};

// Static method to find mentorships by user
mentorshipSchema.statics.findByUser = function(userId, role = 'both') {
  let query = {};
  
  if (role === 'student') {
    query.student = userId;
  } else if (role === 'mentor') {
    query.mentor = userId;
  } else {
    query.$or = [{ student: userId }, { mentor: userId }];
  }
  
  return this.find(query);
};

module.exports = mongoose.model('Mentorship', mentorshipSchema);
