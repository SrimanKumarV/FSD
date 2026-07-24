const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  // Post Details
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  
  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  
  // Post Type
  postType: {
    type: String,
    enum: ['question', 'discussion', 'announcement', 'resource', 'success-story'],
    default: 'discussion'
  },
  
  // Categories and Tags
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['career-guidance', 'higher-studies', 'tech-skills', 'industry-insights', 'networking', 'general', 'alumni-success', 'student-questions']
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'closed', 'pinned', 'archived'],
    default: 'active'
  },
  
  // Engagement Metrics
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Comments/Replies
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters']
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    dislikes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    isSolution: {
      type: Boolean,
      default: false
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    },
    replies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Moderation
  isModerated: {
    type: Boolean,
    default: false
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  moderationReason: String,
  
  // Featured Content
  isFeatured: {
    type: Boolean,
    default: false
  },
  featuredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  featuredAt: Date,
  
  // Additional Features
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number
  }],
  
  // Poll (if applicable)
  poll: {
    question: String,
    options: [{
      text: String,
      votes: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        votedAt: {
          type: Date,
          default: Date.now
        }
      }]
    }],
    isActive: {
      type: Boolean,
      default: false
    },
    endsAt: Date
  },
  
  // Success Story Specific Fields
  successStory: {
    company: String,
    position: String,
    salary: {
      amount: Number,
      currency: String
    },
    interviewProcess: String,
    tips: [String],
    challenges: [String],
    resources: [String]
  }
}, {
  timestamps: true
});

// Indexes for better performance
forumPostSchema.index({ title: 'text', content: 'text', tags: 'text' });
forumPostSchema.index({ category: 1, createdAt: -1 });
forumPostSchema.index({ author: 1, createdAt: -1 });
forumPostSchema.index({ status: 1 });
forumPostSchema.index({ postType: 1 });
forumPostSchema.index({ isFeatured: 1, createdAt: -1 });
forumPostSchema.index({ 'comments.author': 1 });

// Virtual for total likes
forumPostSchema.virtual('totalLikes').get(function() {
  return this.likes.length;
});

// Virtual for total dislikes
forumPostSchema.virtual('totalDislikes').get(function() {
  return this.dislikes.length;
});

// Virtual for total comments
forumPostSchema.virtual('totalComments').get(function() {
  return this.comments.length;
});

// Virtual for isLiked by user
forumPostSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(id => id.equals(userId));
};

// Virtual for isDisliked by user
forumPostSchema.methods.isDislikedBy = function(userId) {
  return this.dislikes.some(id => id.equals(userId));
};

// Virtual for engagement score
forumPostSchema.virtual('engagementScore').get(function() {
  return this.views + (this.likes.length * 2) + (this.comments.length * 3);
});

// Method to like post
forumPostSchema.methods.likePost = function(userId) {
  if (this.likes.some(id => id.equals(userId))) {
    this.likes = this.likes.filter(id => !id.equals(userId));
  } else {
    this.likes.push(userId);
    // Remove from dislikes if exists
    this.dislikes = this.dislikes.filter(id => !id.equals(userId));
  }
  return this.save();
};

// Method to dislike post
forumPostSchema.methods.dislikePost = function(userId) {
  if (this.dislikes.some(id => id.equals(userId))) {
    this.dislikes = this.dislikes.filter(id => !id.equals(userId));
  } else {
    this.dislikes.push(userId);
    // Remove from likes if exists
    this.likes = this.likes.filter(id => !id.equals(userId));
  }
  return this.save();
};

// Method to add comment
forumPostSchema.methods.addComment = function(authorId, content, parentCommentId = null) {
  const comment = {
    author: authorId,
    content: content,
    parentComment: parentCommentId
  };
  
  this.comments.push(comment);
  return this.save();
};

// Method to edit comment
forumPostSchema.methods.editComment = function(commentId, newContent, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  if (!comment.author.equals(userId)) {
    throw new Error('Not authorized to edit this comment');
  }
  
  comment.content = newContent;
  comment.isEdited = true;
  comment.editedAt = new Date();
  comment.updatedAt = new Date();
  
  return this.save();
};

// Method to delete comment
forumPostSchema.methods.deleteComment = function(commentId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  if (!comment.author.equals(userId)) {
    throw new Error('Not authorized to delete this comment');
  }
  
  comment.remove();
  return this.save();
};

// Method to like comment
forumPostSchema.methods.likeComment = function(commentId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  if (comment.likes.some(id => id.equals(userId))) {
    comment.likes = comment.likes.filter(id => !id.equals(userId));
  } else {
    comment.likes.push(userId);
    comment.dislikes = comment.dislikes.filter(id => !id.equals(userId));
  }
  
  return this.save();
};

// Method to mark comment as solution
forumPostSchema.methods.markCommentAsSolution = function(commentId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) {
    throw new Error('Comment not found');
  }
  
  if (!this.author.equals(userId)) {
    throw new Error('Only the post author can mark a solution');
  }
  
  // Unmark all other comments as solution
  this.comments.forEach(c => c.isSolution = false);
  
  // Mark this comment as solution
  comment.isSolution = true;
  
  return this.save();
};

// Method to increment views
forumPostSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to feature post
forumPostSchema.methods.featurePost = function(userId) {
  this.isFeatured = !this.isFeatured;
  if (this.isFeatured) {
    this.featuredBy = userId;
    this.featuredAt = new Date();
  } else {
    this.featuredBy = undefined;
    this.featuredAt = undefined;
  }
  return this.save();
};

// Method to close post
forumPostSchema.methods.closePost = function() {
  this.status = 'closed';
  return this.save();
};

// Method to reopen post
forumPostSchema.methods.reopenPost = function() {
  this.status = 'active';
  return this.save();
};

// Static method to find posts by category
forumPostSchema.statics.findByCategory = function(category, page = 1, limit = 10) {
  return this.find({ category: category, status: 'active' })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'name photo role');
};

// Static method to find featured posts
forumPostSchema.statics.findFeatured = function() {
  return this.find({ isFeatured: true, status: 'active' })
    .sort({ featuredAt: -1 })
    .populate('author', 'name photo role');
};

// Static method to search posts
forumPostSchema.statics.searchPosts = function(searchTerm, page = 1, limit = 10) {
  return this.find({
    $text: { $search: searchTerm },
    status: 'active'
  }, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'name photo role');
};

module.exports = mongoose.model('ForumPost', forumPostSchema);
