const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Job Details
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Company Information
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  companyLogo: String,
  companyWebsite: String,
  
  // Job Type and Category
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'internship', 'contract', 'freelance'],
    required: [true, 'Job type is required']
  },
  category: {
    type: String,
    required: [true, 'Job category is required'],
    trim: true
  },
  
  // Location
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  remoteType: {
    type: String,
    enum: ['fully-remote', 'hybrid', 'on-site'],
    default: 'on-site'
  },
  
  // Requirements
  requirements: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    min: {
      type: Number,
      min: 0,
      default: 0
    },
    max: {
      type: Number,
      min: 0
    }
  },
  education: {
    type: String,
    enum: ['high-school', 'bachelor', 'master', 'phd', 'any'],
    default: 'any'
  },
  
  // Compensation
  salary: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  benefits: [{
    type: String,
    trim: true
  }],
  
  // Application Details
  applicationDeadline: {
    type: Date
  },
  applicationLink: {
    type: String,
    required: [true, 'Application link is required']
  },
  applicationMethod: {
    type: String,
    enum: ['external-link', 'email', 'form'],
    default: 'external-link'
  },
  
  // Posted By
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Poster is required']
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'closed', 'expired', 'draft'],
    default: 'active'
  },
  
  // Statistics
  views: {
    type: Number,
    default: 0
  },
  applications: {
    type: Number,
    default: 0
  },
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Tags for search
  tags: [{
    type: String,
    trim: true
  }],
  
  // Additional Information
  perks: [{
    type: String,
    trim: true
  }],
  workCulture: String,
  growthOpportunities: String,
  
  // Contact Information
  contactEmail: String,
  contactPhone: String,
  
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
jobSchema.index({ title: 'text', description: 'text', company: 'text', skills: 'text' });
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ isRemote: 1 });
jobSchema.index({ 'salary.min': 1, 'salary.max': 1 });

// Virtual for isExpired
jobSchema.virtual('isExpired').get(function() {
  if (this.applicationDeadline) {
    return new Date() > this.applicationDeadline;
  }
  return false;
});

// Virtual for salary range
jobSchema.virtual('salaryRange').get(function() {
  if (this.salary.min && this.salary.max) {
    return `${this.salary.currency} ${this.salary.min.toLocaleString()} - ${this.salary.max.toLocaleString()}`;
  } else if (this.salary.min) {
    return `${this.salary.currency} ${this.salary.min.toLocaleString()}+`;
  } else if (this.salary.max) {
    return `${this.salary.currency} Up to ${this.salary.max.toLocaleString()}`;
  }
  return 'Not specified';
});

// Virtual for experience range
jobSchema.virtual('experienceRange').get(function() {
  if (this.experience.min && this.experience.max) {
    return `${this.experience.min}-${this.experience.max} years`;
  } else if (this.experience.min) {
    return `${this.experience.min}+ years`;
  } else if (this.experience.max) {
    return `Up to ${this.experience.max} years`;
  }
  return 'Not specified';
});

// Virtual for isActive
jobSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.isExpired;
});

// Pre-save middleware to update status based on deadline
jobSchema.pre('save', function(next) {
  if (this.applicationDeadline && new Date() > this.applicationDeadline) {
    this.status = 'expired';
  }
  next();
});

// Method to increment views
jobSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to increment applications
jobSchema.methods.incrementApplications = function() {
  this.applications += 1;
  return this.save();
};

// Method to save job
jobSchema.methods.saveJob = function(userId) {
  if (!this.savedBy.includes(userId)) {
    this.savedBy.push(userId);
    return this.save();
  }
  return this;
};

// Method to unsave job
jobSchema.methods.unsaveJob = function(userId) {
  this.savedBy = this.savedBy.filter(id => !id.equals(userId));
  return this.save();
};

// Method to close job
jobSchema.methods.closeJob = function() {
  this.status = 'closed';
  return this.save();
};

// Method to reopen job
jobSchema.methods.reopenJob = function() {
  if (this.status === 'closed') {
    this.status = 'active';
    return this.save();
  }
  return this;
};

// Static method to find active jobs
jobSchema.statics.findActive = function() {
  return this.find({ 
    status: 'active',
    $or: [
      { applicationDeadline: { $exists: false } },
      { applicationDeadline: { $gt: new Date() } }
    ]
  });
};

// Static method to find jobs by filters
jobSchema.statics.findByFilters = function(filters) {
  const query = { status: 'active' };
  
  if (filters.jobType) query.jobType = filters.jobType;
  if (filters.category) query.category = filters.category;
  if (filters.location) query.location = { $regex: filters.location, $options: 'i' };
  if (filters.isRemote !== undefined) query.isRemote = filters.isRemote;
  if (filters.skills && filters.skills.length > 0) {
    query.skills = { $in: filters.skills };
  }
  if (filters.experience) {
    query['experience.min'] = { $lte: filters.experience };
  }
  
  return this.find(query);
};

// Static method to search jobs
jobSchema.statics.searchJobs = function(searchTerm) {
  return this.find({
    $text: { $search: searchTerm },
    status: 'active'
  }, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Job', jobSchema);
