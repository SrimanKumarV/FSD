const mongoose = require('mongoose');

const helpDeskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, trim: true, default: 'General Enquiry' },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  adminReply: { type: String, trim: true, default: null },
}, { timestamps: true });

module.exports = mongoose.model('HelpDesk', helpDeskSchema);
