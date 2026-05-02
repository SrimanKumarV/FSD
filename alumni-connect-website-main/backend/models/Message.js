const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Sender and Receiver
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver is required']
  },
  
  // Message Content
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  
  // Message Type
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'link', 'system'],
    default: 'text'
  },
  
  // Attachments
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    thumbnail: String
  }],
  
  // Message Status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  // Read Status
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Forwarded from
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Message thread/conversation
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  
  // Message metadata
  metadata: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Scheduled message
  scheduledFor: Date,
  isScheduled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ 'readBy.user': 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ scheduledFor: 1, isScheduled: 1 });

// Virtual for isRead
messageSchema.virtual('isRead').get(function() {
  return this.readBy.length > 0;
});

// Virtual for isReadByUser
messageSchema.methods.isReadByUser = function(userId) {
  return this.readBy.some(read => read.user.equals(userId));
};

// Virtual for isEdited
messageSchema.virtual('isEdited').get(function() {
  return this.metadata.isEdited;
});

// Virtual for isDeleted
messageSchema.virtual('isDeleted').get(function() {
  return this.metadata.isDeleted;
});

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  if (!this.isReadByUser(userId)) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    this.status = 'read';
    return this.save();
  }
  return this;
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function() {
  if (this.status === 'sent') {
    this.status = 'delivered';
    return this.save();
  }
  return this;
};

// Method to edit message
messageSchema.methods.editMessage = function(newContent, userId) {
  if (!this.sender.equals(userId)) {
    throw new Error('Not authorized to edit this message');
  }
  
  this.content = newContent;
  this.metadata.isEdited = true;
  this.metadata.editedAt = new Date();
  
  return this.save();
};

// Method to delete message
messageSchema.methods.deleteMessage = function(userId) {
  if (!this.sender.equals(userId)) {
    throw new Error('Not authorized to delete this message');
  }
  
  this.metadata.isDeleted = true;
  this.metadata.deletedAt = new Date();
  this.metadata.deletedBy = userId;
  
  return this.save();
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(
    r => r.user.equals(userId) && r.emoji === emoji
  );
  
  if (existingReaction) {
    // Remove reaction if same emoji
    this.reactions = this.reactions.filter(
      r => !(r.user.equals(userId) && r.emoji === emoji)
    );
  } else {
    // Remove any existing reaction from this user
    this.reactions = this.reactions.filter(r => !r.user.equals(userId));
    // Add new reaction
    this.reactions.push({
      user: userId,
      emoji: emoji
    });
  }
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId, emoji) {
  this.reactions = this.reactions.filter(
    r => !(r.user.equals(userId) && r.emoji === emoji)
  );
  return this.save();
};

// Method to get conversation participants
messageSchema.methods.getConversationParticipants = function() {
  return [this.sender, this.receiver];
};

// Static method to generate conversation ID
messageSchema.statics.generateConversationId = function(user1Id, user2Id) {
  // Sort IDs to ensure consistent conversation ID regardless of sender/receiver order
  const sortedIds = [user1Id.toString(), user2Id.toString()].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Static method to find conversation messages
messageSchema.statics.findConversation = function(user1Id, user2Id, page = 1, limit = 50) {
  const conversationId = this.generateConversationId(user1Id, user2Id);
  
  return this.find({
    conversationId: conversationId,
    'metadata.isDeleted': false
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name photo role')
    .populate('receiver', 'name photo role')
    .populate('replyTo', 'content sender')
    .populate('forwardedFrom', 'content sender');
};

// Static method to find unread messages for a user
messageSchema.statics.findUnreadForUser = function(userId) {
  return this.find({
    receiver: userId,
    'metadata.isDeleted': false,
    'readBy.user': { $ne: userId }
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name photo role');
};

// Static method to find recent conversations for a user
messageSchema.statics.findRecentConversations = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId(userId) },
          { receiver: mongoose.Types.ObjectId(userId) }
        ],
        'metadata.isDeleted': false
      }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $last: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$receiver', mongoose.Types.ObjectId(userId)] },
                  { $not: { $in: [mongoose.Types.ObjectId(userId), '$readBy.user'] } }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    },
    {
      $limit: 20
    }
  ]);
};

// Static method to delete conversation
messageSchema.statics.deleteConversation = function(user1Id, user2Id) {
  const conversationId = this.generateConversationId(user1Id, user2Id);
  
  return this.updateMany(
    { conversationId: conversationId },
    {
      'metadata.isDeleted': true,
      'metadata.deletedAt': new Date()
    }
  );
};

// Static method to search messages
messageSchema.statics.searchMessages = function(userId, searchTerm, page = 1, limit = 20) {
  return this.find({
    $or: [
      { sender: userId },
      { receiver: userId }
    ],
    content: { $regex: searchTerm, $options: 'i' },
    'metadata.isDeleted': false
  })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name photo role')
    .populate('receiver', 'name photo role');
};

module.exports = mongoose.model('Message', messageSchema);
