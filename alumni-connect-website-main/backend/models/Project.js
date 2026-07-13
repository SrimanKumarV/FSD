const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a project title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  tags: {
    type: [String],
    required: true,
    validate: [v => v.length > 0, 'Please add at least one tag']
  },
  githubLink: {
    type: String,
    match: [
      /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-._]+/,
      'Please use a valid GitHub URL'
    ]
  },
  liveLink: {
    type: String,
    match: [
      /^https?:\/\//,
      'Please use a valid URL with HTTP or HTTPS'
    ]
  },
  thumbnail: {
    type: String,
    default: 'no-photo.jpg'
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting the number of likes
projectSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

module.exports = mongoose.model('Project', projectSchema);
