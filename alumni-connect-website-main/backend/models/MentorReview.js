const mongoose = require('mongoose');

const mentorReviewSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    required: true,
    maxlength: 500
  },
  categories: {
    communication: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    guidance: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    availability: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    technicalKnowledge: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    }
  }
}, {
  timestamps: true
});

mentorReviewSchema.index({ mentorId: 1, studentId: 1 }, { unique: true }); // One review per student per mentor

// Static method to calculate average rating
mentorReviewSchema.statics.calculateAverageRating = async function(mentorId) {
  const stats = await this.aggregate([
    {
      $match: { mentorId: mentorId }
    },
    {
      $group: {
        _id: '$mentorId',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await this.model('User').findByIdAndUpdate(mentorId, {
      'alumniInfo.mentorRating': Math.round(stats[0].avgRating * 10) / 10,
      'alumniInfo.mentorReviewCount': stats[0].numReviews
    });
  } else {
    await this.model('User').findByIdAndUpdate(mentorId, {
      'alumniInfo.mentorRating': 0,
      'alumniInfo.mentorReviewCount': 0
    });
  }
};

// Call calculateAverageRating after saving
mentorReviewSchema.post('save', function() {
  this.constructor.calculateAverageRating(this.mentorId);
});

// Call calculateAverageRating before removing
mentorReviewSchema.pre('remove', function(next) {
  this.constructor.calculateAverageRating(this.mentorId);
  next();
});

module.exports = mongoose.model('MentorReview', mentorReviewSchema);
