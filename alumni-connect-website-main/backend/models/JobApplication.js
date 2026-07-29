const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  coverLetter: {
    type: String,
    trim: true,
    maxlength: [2000, 'Cover letter cannot exceed 2000 characters']
  },
  resumeLink: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to ensure a user can only apply once per job
jobApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Index for getting applications by user or job
jobApplicationSchema.index({ applicant: 1 });
jobApplicationSchema.index({ job: 1, status: 1 });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
