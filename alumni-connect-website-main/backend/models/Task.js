const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  actionText: { type: String, default: 'Complete Task' },
  actionUrl: { type: String },
  targetAudience: { type: String, enum: ['all', 'student', 'alumni'], default: 'all' },
  taskType: { type: String, enum: ['generic', 'profile_completion'], default: 'generic' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
