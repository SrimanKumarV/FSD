const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { protect, verified } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const ChatGroup = require('../models/ChatGroup');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

router.get('/global', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ isGlobal: true, 'metadata.isDeleted': false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'name photo role');

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching global conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get conversation messages
// @route   GET /api/messages/conversation/:userId
// @access  Private
router.get('/conversation/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let isGroup = false;
    if (userId.startsWith('group_')) {
      isGroup = true;
      const groupId = userId.replace('group_', '');
      const group = await ChatGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
      if (!group.members.includes(req.user.id) && group.admin.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not a member of this group' });
      }
    } else {
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // For now, allow messaging between any users
    // In production, you might want to check if they're connected
    const messages = await Message.findConversation(
      req.user.id,
      userId,
      parseInt(page),
      parseInt(limit)
    );

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Start chat by email
// @route   POST /api/messages/start-chat
// @access  Private
router.post('/start-chat', protect, [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found with this email' });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot start a chat with yourself' });
    }

    const isConnected = targetUser.connections && targetUser.connections.includes(req.user.id);
    const isFollower = targetUser.followers && targetUser.followers.includes(req.user.id);
    const isFollowing = req.user.followers && req.user.followers.includes(targetUser._id);
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isConnected && !isFollower && !isFollowing) {
      return res.status(403).json({ message: 'You can only chat with your connections or followers' });
    }

    res.json({ targetUser: { _id: targetUser._id, name: targetUser.name, photo: targetUser.photo, role: targetUser.role } });
  } catch (error) {
    console.error('Error starting chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create a new group
// @route   POST /api/messages/group
// @access  Private
router.post('/group', protect, [
  body('name').trim().notEmpty().withMessage('Group name is required'),
  body('emails').isArray({ min: 1 }).withMessage('At least one member email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, emails, description } = req.body;
    
    // Find users by email
    const users = await User.find({ email: { $in: emails } });
    const membersIds = users.map(u => u._id.toString());
    
    // Add creator to members if not present
    const uniqueMembers = [...new Set([...membersIds, req.user.id])];

    const group = new ChatGroup({
      name,
      description,
      admin: req.user.id,
      members: uniqueMembers
    });

    await group.save();
    await group.populate('members', 'name photo role');
    await group.populate('admin', 'name photo role');

    res.status(201).json({ group });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
router.post('/', [protect, verified], [
  body('receiver').notEmpty().withMessage('Receiver is required'),
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

    if (receiver === 'global') {
      const message = new Message({
        sender: req.user.id,
        content,
        messageType,
        attachments,
        replyTo,
        conversationId: 'global',
        isGlobal: true,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        isScheduled: !!scheduledFor
      });

      await message.save();
      await message.populate('sender', 'name photo role');

      return res.status(201).json({ message });
    }

    if (receiver.startsWith('group_')) {
      const groupId = receiver.replace('group_', '');
      const group = await ChatGroup.findById(groupId);
      if (!group) return res.status(404).json({ message: 'Group not found' });
      
      const message = new Message({
        sender: req.user.id,
        content,
        messageType,
        attachments,
        replyTo,
        groupId: groupId,
        conversationId: receiver, // 'group_xyz'
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        isScheduled: !!scheduledFor
      });
      await message.save();
      await message.populate('sender', 'name photo role');
      
      return res.status(201).json({ message });
    }

    // Check if receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Check if trying to message self
    if (receiver === req.user.id) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    const isConnected = receiverUser.connections && receiverUser.connections.includes(req.user.id);
    const isFollower = receiverUser.followers && receiverUser.followers.includes(req.user.id);
    const isFollowing = req.user.followers && req.user.followers.includes(receiverUser._id);
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && !isConnected && !isFollower && !isFollowing) {
      return res.status(403).json({ message: 'You can only chat with your connections or followers' });
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
      type: 'message-received',
      title: 'New Message',
      content: `You have a new message from ${req.user.name}`,
      relatedData: { messageId: message._id }
    });

    // Send email notification to receiver
    await sendEmail({
      email: receiverUser.email,
      subject: `New Message from ${req.user.name} on Alumnex Connect`,
      message: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            <h2 style="margin: 0; color: #1f2937;">Alumnex Connect</h2>
          </div>
          <div style="padding: 20px;">
            <p style="color: #374151; font-size: 16px;">Hi <strong>${receiverUser.name}</strong>,</p>
            <p style="color: #374151; font-size: 16px;">You have received a new message from <strong>${req.user.name}</strong>.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">For your privacy and security, the content of this message is not included in this email.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat?startChat=${req.user.email}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reply to Message</a>
            </div>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">This email was sent by Alumnex Connect.</p>
          </div>
        </div>
      `
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @desc    Get recent conversations
// @route   GET /api/messages/conversations
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversationsRaw = await Message.findRecentConversations(req.user.id);
    
    // Populate participants
    const chats = await Promise.all(conversationsRaw.map(async (conv) => {
      const msg = conv.lastMessage;
      if (msg && msg.content) {
        msg.content = Message.decryptMessage(msg.content);
      }
      
      // If it's a group message, handle it
      if (msg.groupId) {
        const group = await ChatGroup.findById(msg.groupId).select('name avatar members admin');
        if (!group) return null;
        // Verify user is in group
        if (!group.members.includes(req.user.id) && group.admin.toString() !== req.user.id) return null;
        
        return {
          _id: `group_${group._id}`,
          isGroup: true,
          group: group,
          participants: [],
          lastMessage: msg,
          unreadCount: conv.unreadCount
        };
      }

      const otherId = msg.sender.toString() === req.user.id ? msg.receiver : msg.sender;
      if (!otherId) return null;
      const otherUser = await User.findById(otherId).select('name photo role isOnline status');
      const currentUser = await User.findById(req.user.id).select('name photo role isOnline status');
      
      return {
        _id: conv._id,
        isGroup: false,
        participants: [currentUser, otherUser].filter(Boolean),
        lastMessage: msg,
        unreadCount: conv.unreadCount
      };
    }));
    
    // Also fetch groups that have NO messages yet, and add them
    const emptyGroups = await ChatGroup.find({
      members: req.user.id,
      _id: { $nin: chats.filter(Boolean).filter(c => c.isGroup).map(c => c.group._id) }
    }).select('name avatar members admin');
    
    const emptyChats = emptyGroups.map(group => ({
      _id: `group_${group._id}`,
      isGroup: true,
      group: group,
      participants: [],
      lastMessage: null,
      unreadCount: 0
    }));

    res.json({ chats: [...chats.filter(Boolean), ...emptyChats].sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
      return dateB - dateA;
    })});
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
    const conversationId = userId.startsWith('group_') ? userId : Message.generateConversationId(req.user.id, userId);

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
    const conversationId = userId.startsWith('group_') ? userId : Message.generateConversationId(req.user.id, userId);

    await Message.deleteConversation(conversationId, req.user.id);
    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
