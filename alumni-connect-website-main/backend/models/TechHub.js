const mongoose = require('mongoose');

const techAssistanceQuestionSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  techStack: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['open', 'resolved', 'closed'],
    default: 'open'
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

techAssistanceQuestionSchema.virtual('replies', {
  ref: 'TechAssistanceReply',
  localField: '_id',
  foreignField: 'questionId'
});

const TechAssistanceQuestion = mongoose.model('TechAssistanceQuestion', techAssistanceQuestionSchema);

const techAssistanceReplySchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TechAssistanceQuestion',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isAccepted: {
    type: Boolean,
    default: false
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

techAssistanceReplySchema.virtual('upvoteCount').get(function() {
  return this.upvotes ? this.upvotes.length : 0;
});

const TechAssistanceReply = mongoose.model('TechAssistanceReply', techAssistanceReplySchema);

module.exports = { TechAssistanceQuestion, TechAssistanceReply };
