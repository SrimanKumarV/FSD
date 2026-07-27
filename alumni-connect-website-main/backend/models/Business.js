const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  founder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  stage: {
    type: String,
    enum: ['Idea', 'Seed', 'Early Stage', 'Growth', 'Established'],
    default: 'Early Stage'
  },
  description: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  hiring: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String
  }],
  views: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
