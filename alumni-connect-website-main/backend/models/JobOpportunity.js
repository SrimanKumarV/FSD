const mongoose = require('mongoose');

const jobOpportunitySchema = new mongoose.Schema({
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['internship', 'job', 'referral', 'walk-in', 'hackathon'],
    required: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [{
    type: String,
    trim: true
  }],
  applicationLink: {
    type: String,
    trim: true
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  applicants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

jobOpportunitySchema.index({ type: 1, status: 1 });
jobOpportunitySchema.index({ company: 1 });

module.exports = mongoose.model('JobOpportunity', jobOpportunitySchema);
