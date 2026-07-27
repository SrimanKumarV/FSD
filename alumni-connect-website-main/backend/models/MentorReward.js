const mongoose = require('mongoose');

const mentorRewardSchema = new mongoose.Schema({
  mentor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  college: {
    type: String,
    trim: true,
    default: ''
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  breakdown: {
    acceptedRequests: { type: Number, default: 0 },
    completedMentorships: { type: Number, default: 0 },
    feedbackPoints: { type: Number, default: 0 },
    sessionPoints: { type: Number, default: 0 },
    totalFeedbacks: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Helper: recalculate totalPoints from breakdown
mentorRewardSchema.methods.recalculate = function () {
  const b = this.breakdown;
  this.totalPoints =
    (b.acceptedRequests * 5) +
    (b.completedMentorships * 20) +
    b.feedbackPoints +
    b.sessionPoints;
  this.lastUpdated = new Date();
};

// Static: get or create a reward record for a mentor
mentorRewardSchema.statics.getOrCreate = async function (mentorId, college) {
  let record = await this.findOne({ mentor: mentorId });
  if (!record) {
    record = new this({ mentor: mentorId, college: college || '' });
    await record.save();
  }
  return record;
};

// Static: add points for an action
mentorRewardSchema.statics.addPoints = async function (mentorId, action, rating, college) {
  let record = await this.getOrCreate(mentorId, college);

  switch (action) {
    case 'accepted':
      record.breakdown.acceptedRequests += 1;
      break;
    case 'completed':
      record.breakdown.completedMentorships += 1;
      break;
    case 'feedback':
      // rating: 1-5
      const feedbackPoints = [0, 0, 2, 4, 7, 10][Math.round(rating)] || 0;
      record.breakdown.feedbackPoints += feedbackPoints;
      record.breakdown.totalFeedbacks += 1;
      // Update running average
      const oldAvg = record.breakdown.averageRating || 0;
      const count = record.breakdown.totalFeedbacks;
      record.breakdown.averageRating = parseFloat(
        ((oldAvg * (count - 1) + rating) / count).toFixed(2)
      );
      break;
    case 'session':
      record.breakdown.sessionPoints += 2;
      break;
    default:
      break;
  }

  record.recalculate();
  await record.save();
  return record;
};

const MentorReward = mongoose.model('MentorReward', mentorRewardSchema);
module.exports = MentorReward;
