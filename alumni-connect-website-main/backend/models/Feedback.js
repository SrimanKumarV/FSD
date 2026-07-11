const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['bug', 'feature', 'general', 'ui', 'performance', 'other'],
    required: true
  },
  rating: { type: Number, min: 1, max: 5, required: true },
  subject: { type: String, required: true, trim: true, maxlength: 150 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ['pending', 'in-review', 'resolved', 'closed'], default: 'pending' },
  adminReply: { type: String, trim: true, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
