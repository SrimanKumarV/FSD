const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, verified } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Get conversation messages
// @route   GET /api/messages/conversation/:userId
// @access  Private
router.get('/conversation/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Check if users are connected
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For now, allow messaging between any users
    // In production, you might want to check if they're connected
    const conversationId = Message.generateConversationId(req.user.id, userId);

    const messages = await Message.findConversation(conversationId, {
      skip,
      limit: parseInt(limit)
    });

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
router.post('/', [protect, verified], [
  body('receiver').isMongoId().withMessage('Valid receiver ID is required'),
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Message content is required and must be under 5000 characters'),
  body('messageType').optional().isIn(['text', 'image', 'file', 'link']).withMessage('Invalid message type'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array'),
  body('replyTo').optional().isMongoId().withMessage('Invalid reply message ID'),
  body('scheduledFor').optional().isISO8601().withMessage('Invalid scheduled date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      receiver, content, messageType = 'text', attachments, replyTo, scheduledFor
    } = req.body;

    // Check if receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check if trying to message self
    if (receiver === req.user.id) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    // Generate conversation ID
    const conversationId = Message.generateConversationId(req.user.id, receiver);

    const message = new Message({
      sender: req.user.id,
      receiver,
      content,
      messageType,
      attachments,
      replyTo,
      conversationId,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      isScheduled: !!scheduledFor
    });

    await message.save();

    // Populate for response
    await message.populate('sender', 'name photo role');
    await message.populate('receiver', 'name photo role');

    // Create notification for receiver
    await Notification.createNotification({
      recipient: receiver,
      sender: req.user.id,
      type: 'new_message',
      title: 'New Message',
      content: `You have a new message from ${req.user.name}`,
      relatedData: { messageId: message._id }
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get recent conversations
// @route   GET /api/messages/conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const conversations = await Message.findRecentConversations(req.user.id, {
      skip,
      limit: parseInt(limit)
    });

    res.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.receiver.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await message.markAsRead(req.user.id);
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark all messages in conversation as read
// @route   PUT /api/messages/conversation/:userId/read
// @access  Private
router.put('/conversation/:userId/read', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const conversationId = Message.generateConversationId(req.user.id, userId);

    // Mark all unread messages in this conversation as read
    await Message.updateMany(
      {
        conversationId,
        receiver: req.user.id,
        readBy: { $ne: req.user.id }
      },
      {
        $push: { readBy: req.user.id },
        $set: { readAt: new Date() }
      }
    );

    res.json({ message: 'All messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Edit message
// @route   PUT /api/messages/:id
// @access  Private (Message sender only)
router.put('/:id', protect, [
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Message content is required and must be under 5000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: 'Cannot edit deleted message' });
    }

    await message.editMessage(req.body.content);

    // Populate for response
    await message.populate('sender', 'name photo role');
    await message.populate('receiver', 'name photo role');

    res.json({ message });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private (Message sender only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await message.deleteMessage(req.user.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    React to message
// @route   POST /api/messages/:id/reactions
// @access  Private
router.post('/:id/reactions', protect, [
  body('reaction').isIn(['👍', '❤️', '😊', '🎉', '👏', '🔥', '💯', '🤔']).withMessage('Invalid reaction')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const { reaction } = req.body;

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user.id && r.emoji === reaction
    );

    if (existingReaction) {
      // Remove reaction
      await message.removeReaction(req.user.id, reaction);
      res.json({ message: 'Reaction removed', reaction: null });
    } else {
      // Add reaction
      await message.addReaction(req.user.id, reaction);
      res.json({ message: 'Reaction added', reaction });
    }
  } catch (error) {
    console.error('Error reacting to message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Forward message
// @route   POST /api/messages/:id/forward
// @access  Private
router.post('/:id/forward', protect, [
  body('receivers').isArray({ min: 1 }).withMessage('At least one receiver is required'),
  body('receivers.*').isMongoId().withMessage('Invalid receiver ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const originalMessage = await Message.findById(req.params.id);
    if (!originalMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const { receivers } = req.body;
    const forwardedMessages = [];

    for (const receiverId of receivers) {
      // Check if receiver exists
      const receiverUser = await User.findById(receiverId);
      if (!receiverUser) continue;

      // Check if trying to forward to self
      if (receiverId === req.user.id) continue;

      const conversationId = Message.generateConversationId(req.user.id, receiverId);

      const forwardedMessage = new Message({
        sender: req.user.id,
        receiver: receiverId,
        content: originalMessage.content,
        messageType: originalMessage.messageType,
        attachments: originalMessage.attachments,
        forwardedFrom: originalMessage._id,
        conversationId
      });

      await forwardedMessage.save();
      forwardedMessages.push(forwardedMessage);

      // Create notification for receiver
      await Notification.createNotification({
        recipient: receiverId,
        sender: req.user.id,
        type: 'new_message',
        title: 'New Message',
        content: `You have a new message from ${req.user.name}`,
        relatedData: { messageId: forwardedMessage._id }
      });
    }

    res.json({ 
      message: 'Messages forwarded successfully',
      forwardedMessages: forwardedMessages.length
    });
  } catch (error) {
    console.error('Error forwarding message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Search messages
// @route   GET /api/messages/search
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { q, conversationId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchResults = await Message.searchMessages(q, {
      userId: req.user.id,
      conversationId,
      startDate,
      endDate,
      skip,
      limit: parseInt(limit)
    });

    res.json(searchResults);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const unreadCount = await Message.getUnreadCount(req.user.id);
    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete conversation
// @route   DELETE /api/messages/conversation/:userId
// @access  Private
router.delete('/conversation/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const conversationId = Message.generateConversationId(req.user.id, userId);

    await Message.deleteConversation(conversationId, req.user.id);
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
