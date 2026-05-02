const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // Event Details
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Event Type
  eventType: {
    type: String,
    enum: ['webinar', 'workshop', 'seminar', 'networking', 'conference', 'hackathon', 'other'],
    required: [true, 'Event type is required']
  },
  
  // Date and Time
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Location
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  virtualPlatform: {
    type: String,
    enum: ['zoom', 'teams', 'google-meet', 'webex', 'other'],
    default: 'zoom'
  },
  meetingLink: String,
  meetingPassword: String,
  
  // Organizer
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organizer is required']
  },
  coOrganizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Capacity and Registration
  maxCapacity: {
    type: Number,
    min: 1
  },
  currentRegistrations: {
    type: Number,
    default: 0
  },
  isRegistrationRequired: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date
  },
  
  // Categories and Tags
  category: {
    type: String,
    required: [true, 'Event category is required'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Event Details
  agenda: [{
    time: String,
    title: String,
    description: String,
    speaker: String
  }],
  speakers: [{
    name: String,
    title: String,
    company: String,
    bio: String,
    photo: String
  }],
  
  // Resources
  materials: [{
    title: String,
    description: String,
    fileUrl: String,
    fileType: String
  }],
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  // Pricing
  isFree: {
    type: Boolean,
    default: true
  },
  price: {
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Statistics
  views: {
    type: Number,
    default: 0
  },
  registrations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'no-show', 'cancelled'],
      default: 'registered'
    },
    notes: String
  }],
  
  // Reminders
  reminders: [{
    type: String,
    enum: ['1-hour', '1-day', '1-week'],
    default: ['1-day']
  }],
  
  // Additional Information
  requirements: [{
    type: String,
    trim: true
  }],
  whatToBring: [{
    type: String,
    trim: true
  }],
  dressCode: String,
  
  // Contact Information
  contactEmail: String,
  contactPhone: String,
  
  // Social Media
  socialLinks: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
eventSchema.index({ title: 'text', description: 'text', category: 'text' });
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ isVirtual: 1 });
eventSchema.index({ 'registrations.user': 1 });

// Virtual for isUpcoming
eventSchema.virtual('isUpcoming').get(function() {
  return this.startDate > new Date();
});

// Virtual for isOngoing
eventSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
});

// Virtual for isPast
eventSchema.virtual('isPast').get(function() {
  return this.endDate < new Date();
});

// Virtual for isFull
eventSchema.virtual('isFull').get(function() {
  return this.maxCapacity && this.currentRegistrations >= this.maxCapacity;
});

// Virtual for canRegister
eventSchema.virtual('canRegister').get(function() {
  if (!this.isRegistrationRequired) return false;
  if (this.isFull) return false;
  if (this.registrationDeadline && new Date() > this.registrationDeadline) return false;
  return this.status === 'published' && this.isUpcoming;
});

// Virtual for timeUntilStart
eventSchema.virtual('timeUntilStart').get(function() {
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
eventSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.startDate <= now && this.endDate >= now) {
    this.status = 'ongoing';
  } else if (this.endDate < now) {
    this.status = 'completed';
  }
  
  next();
});

// Method to increment views
eventSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to register user
eventSchema.methods.registerUser = function(userId) {
  if (!this.canRegister) {
    throw new Error('Cannot register for this event');
  }
  
  const existingRegistration = this.registrations.find(
    reg => reg.user.toString() === userId.toString()
  );
  
  if (existingRegistration) {
    throw new Error('User already registered');
  }
  
  this.registrations.push({ user: userId });
  this.currentRegistrations += 1;
  return this.save();
};

// Method to unregister user
eventSchema.methods.unregisterUser = function(userId) {
  const registrationIndex = this.registrations.findIndex(
    reg => reg.user.toString() === userId.toString()
  );
  
  if (registrationIndex === -1) {
    throw new Error('User not registered');
  }
  
  this.registrations.splice(registrationIndex, 1);
  this.currentRegistrations -= 1;
  return this.save();
};

// Method to update registration status
eventSchema.methods.updateRegistrationStatus = function(userId, status) {
  const registration = this.registrations.find(
    reg => reg.user.toString() === userId.toString()
  );
  
  if (!registration) {
    throw new Error('User not registered');
  }
  
  registration.status = status;
  return this.save();
};

// Method to publish event
eventSchema.methods.publish = function() {
  this.status = 'published';
  return this.save();
};

// Method to cancel event
eventSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function() {
  return this.find({
    status: 'published',
    startDate: { $gt: new Date() }
  }).sort({ startDate: 1 });
};

// Static method to find events by category
eventSchema.statics.findByCategory = function(category) {
  return this.find({
    category: category,
    status: 'published'
  }).sort({ startDate: 1 });
};

// Static method to find virtual events
eventSchema.statics.findVirtual = function() {
  return this.find({
    isVirtual: true,
    status: 'published'
  }).sort({ startDate: 1 });
};

module.exports = mongoose.model('Event', eventSchema);
