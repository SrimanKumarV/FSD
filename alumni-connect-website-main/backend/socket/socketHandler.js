const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// Store online users
// Map<userId, { socketIds: Set<string>, user: object, lastSeen: Date }>
const onlineUsers = new Map();

// Socket.IO handler
module.exports = (io) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace('Bearer ', '');
      
      // Verify token
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      
      // Get user
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (!user.isActive) {
        return next(new Error('Authentication error: User account deactivated'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    const userName = socket.user.name;

    console.log(`User connected: ${userName} (${userId}) on socket ${socket.id}`);

    let userSession = onlineUsers.get(userId);
    let isFirstConnection = false;

    if (userSession) {
      userSession.socketIds.add(socket.id);
      userSession.lastSeen = new Date();
    } else {
      isFirstConnection = true;
      userSession = {
        socketIds: new Set([socket.id]),
        user: socket.user,
        lastSeen: new Date()
      };
      onlineUsers.set(userId, userSession);
    }

    // Join user to their personal room
    socket.join(userId);

    // Emit online status to all users ONLY if it's their first active connection
    if (isFirstConnection) {
      io.emit('user:online', {
        userId: userId,
        userName: userName,
        timestamp: new Date()
      });
    }

    // Send online users list to the connected user
    const sendOnlineUsersList = () => {
      const onlineUsersList = Array.from(onlineUsers.values()).map(u => ({
        userId: u.user._id.toString(),
        userName: u.user.name,
        role: u.user.role,
        lastSeen: u.lastSeen
      }));
      socket.emit('users:online', onlineUsersList);
    };
    sendOnlineUsersList();

    // Allow frontend to request the list explicitly
    socket.on('get:users:online', sendOnlineUsersList);

    // Handle private message
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, content, messageType = 'text', attachments = [] } = data;

        if (!receiverId || !content) {
          socket.emit('message:error', { message: 'Receiver ID and content are required' });
          return;
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit('message:error', { message: 'Receiver not found' });
          return;
        }

        // Create message
        const message = new Message({
          sender: userId,
          receiver: receiverId,
          content,
          messageType,
          attachments,
          replyTo: data.replyTo || null,
          conversationId: Message.generateConversationId(userId, receiverId)
        });

        await message.save();

        // Populate sender and receiver info
        await message.populate('sender', 'name photo role');
        await message.populate('receiver', 'name photo role');

        // Emit to sender (confirmation) - in case they have multiple tabs open
        const senderSession = onlineUsers.get(userId);
        if (senderSession) {
          senderSession.socketIds.forEach(id => {
            io.to(id).emit('message:sent', {
              message: message,
              timestamp: new Date()
            });
          });
        }

        // Emit to receiver's active devices
        const receiverSession = onlineUsers.get(receiverId);
        if (receiverSession) {
          receiverSession.socketIds.forEach(id => {
            io.to(id).emit('message:received', {
              message: message,
              timestamp: new Date()
            });
          });
        }

        // Create notification for receiver
        await Notification.createNotification({
          recipient: receiverId,
          sender: userId,
          type: 'message-received',
          title: `New message from ${userName}`,
          content: content.length > 50 ? content.substring(0, 50) + '...' : content,
          relatedData: {
            messageId: message._id
          },
          priority: 'normal',
          requiresAction: false
        });

        // Update conversation list for both users
        const conversationUpdate = {
          conversationId: message.conversationId,
          lastMessage: message,
          timestamp: new Date()
        };

        if (senderSession) {
          senderSession.socketIds.forEach(id => io.to(id).emit('conversation:updated', conversationUpdate));
        }
        if (receiverSession) {
          receiverSession.socketIds.forEach(id => io.to(id).emit('conversation:updated', conversationUpdate));
        }

      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('message:error', { message: 'Failed to send message' });
      }
    });

    // Handle message reaction (Instagram double tap)
    socket.on('message:react', async (data) => {
      try {
        const { messageId, emoji } = data;
        if (!messageId || !emoji) return;

        const message = await Message.findById(messageId);
        if (!message) return;

        await message.addReaction(userId, emoji);
        await message.populate('reactions.user', 'name');

        const receiverSession = onlineUsers.get(message.receiver.toString());
        const senderSession = onlineUsers.get(message.sender.toString());

        const reactionUpdate = {
          messageId: message._id,
          reactions: message.reactions
        };

        if (receiverSession) {
          receiverSession.socketIds.forEach(id => io.to(id).emit('message:reacted', reactionUpdate));
        }
        if (senderSession) {
          senderSession.socketIds.forEach(id => io.to(id).emit('message:reacted', reactionUpdate));
        }
      } catch (error) {
        console.error('Reaction error:', error);
      }
    });

    // Handle message unsend (Instagram unsend)
    socket.on('message:unsend', async (data) => {
      try {
        const { messageId } = data;
        if (!messageId) return;

        const message = await Message.findById(messageId);
        if (!message) return;

        // Ensure only sender can unsend
        if (message.sender.toString() !== userId) return;

        await message.deleteMessage(userId);

        const receiverSession = onlineUsers.get(message.receiver.toString());
        const senderSession = onlineUsers.get(message.sender.toString());

        const unsendUpdate = {
          messageId: message._id
        };

        if (receiverSession) {
          receiverSession.socketIds.forEach(id => io.to(id).emit('message:unsent', unsendUpdate));
        }
        if (senderSession) {
          senderSession.socketIds.forEach(id => io.to(id).emit('message:unsent', unsendUpdate));
        }
      } catch (error) {
        console.error('Unsend error:', error);
      }
    });

    // Handle message read
    socket.on('message:read', async (data) => {
      try {
        const { messageId } = data;

        if (!messageId) {
          socket.emit('message:error', { message: 'Message ID is required' });
          return;
        }

        // Find and mark message as read
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('message:error', { message: 'Message not found' });
          return;
        }

        // Check if user is the receiver
        if (message.receiver.toString() !== userId) {
          socket.emit('message:error', { message: 'Not authorized to mark this message as read' });
          return;
        }

        await message.markAsRead(userId);

        // Emit read confirmation to sender
        const senderSession = onlineUsers.get(message.sender.toString());
        if (senderSession) {
          senderSession.socketIds.forEach(id => {
            io.to(id).emit('message:read', {
              messageId: messageId,
              readBy: userId,
              timestamp: new Date()
            });
          });
        }

      } catch (error) {
        console.error('Message read error:', error);
        socket.emit('message:error', { message: 'Failed to mark message as read' });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', (data) => {
      const { receiverId } = data;
      
      if (receiverId) {
        const receiverSession = onlineUsers.get(receiverId);
        if (receiverSession) {
          receiverSession.socketIds.forEach(id => {
            io.to(id).emit('typing:start', {
              userId: userId,
              userName: userName
            });
          });
        }
      }
    });

    socket.on('typing:stop', (data) => {
      const { receiverId } = data;
      
      if (receiverId) {
        const receiverSession = onlineUsers.get(receiverId);
        if (receiverSession) {
          receiverSession.socketIds.forEach(id => {
            io.to(id).emit('typing:stop', {
              userId: userId
            });
          });
        }
      }
    });

    // Handle user status update
    socket.on('user:status', async (data) => {
      try {
        const { status, customStatus } = data;
        
        // Update user status in database
        await User.findByIdAndUpdate(userId, {
          status: status || 'online',
          customStatus: customStatus
        });

        // Emit status update to all users
        io.emit('user:status:updated', {
          userId: userId,
          userName: userName,
          status: status || 'online',
          customStatus: customStatus,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Status update error:', error);
        socket.emit('status:error', { message: 'Failed to update status' });
      }
    });

    // Handle user away status
    socket.on('user:away', () => {
      io.emit('user:away', {
        userId: userId,
        userName: userName,
        timestamp: new Date()
      });
    });

    // Handle user back online
    socket.on('user:back', () => {
      io.emit('user:back', {
        userId: userId,
        userName: userName,
        timestamp: new Date()
      });
    });

    // Handle join room (for group chats, events, etc.)
    socket.on('room:join', (data) => {
      const { roomId } = data;
      
      if (roomId) {
        socket.join(roomId);
        socket.emit('room:joined', { roomId, timestamp: new Date() });
        
        // Notify others in the room
        socket.to(roomId).emit('user:joined:room', {
          userId: userId,
          userName: userName,
          roomId: roomId,
          timestamp: new Date()
        });
      }
    });

    // Handle leave room
    socket.on('room:leave', (data) => {
      const { roomId } = data;
      
      if (roomId) {
        socket.leave(roomId);
        socket.emit('room:left', { roomId, timestamp: new Date() });
        
        // Notify others in the room
        socket.to(roomId).emit('user:left:room', {
          userId: userId,
          userName: userName,
          roomId: roomId,
          timestamp: new Date()
        });
      }
    });

    // Handle room message (for group chats, events, etc.)
    socket.on('room:message', async (data) => {
      try {
        const { roomId, content, messageType = 'text', attachments = [] } = data;

        if (!roomId || !content) {
          socket.emit('room:message:error', { message: 'Room ID and content are required' });
          return;
        }

        // Emit to all users in the room
        io.to(roomId).emit('room:message:received', {
          sender: {
            userId: userId,
            userName: userName,
            role: socket.user.role
          },
          content,
          messageType,
          attachments,
          roomId,
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Room message error:', error);
        socket.emit('room:message:error', { message: 'Failed to send room message' });
      }
    });

    // --- WEBRTC SIGNALING EVENTS ---
    
    // Caller initiates a call (sends offer)
    socket.on('call:request', (data) => {
      const { receiverId, offer, callerName, isVideo } = data;
      const receiverSession = onlineUsers.get(receiverId);
      
      if (receiverSession && receiverSession.socketIds.size > 0) {
        receiverSession.socketIds.forEach(id => {
          io.to(id).emit('call:incoming', {
            callerId: userId,
            callerName: callerName || userName,
            isVideo: isVideo,
            offer: offer
          });
        });
      } else {
        // If receiver is offline, immediately tell caller
        socket.emit('call:error', { message: 'User is offline' });
      }
    });

    // Receiver answers the call (sends answer)
    socket.on('call:answer', (data) => {
      const { callerId, answer } = data;
      const callerSession = onlineUsers.get(callerId);
      
      if (callerSession) {
        callerSession.socketIds.forEach(id => {
          io.to(id).emit('call:accepted', {
            answer: answer
          });
        });
      }
    });

    // Exchange ICE Candidates
    socket.on('call:ice-candidate', (data) => {
      const { targetId, candidate } = data;
      const targetSession = onlineUsers.get(targetId);
      
      if (targetSession) {
        targetSession.socketIds.forEach(id => {
          io.to(id).emit('call:ice-candidate', {
            candidate: candidate
          });
        });
      }
    });

    // End call or reject call
    socket.on('call:end', (data) => {
      const { targetId, reason } = data;
      const targetSession = onlineUsers.get(targetId);
      
      if (targetSession) {
        targetSession.socketIds.forEach(id => {
          io.to(id).emit('call:ended', { reason });
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userName} (${userId}) on socket ${socket.id}`);

      const session = onlineUsers.get(userId);
      if (session) {
        session.socketIds.delete(socket.id);

        if (session.socketIds.size === 0) {
          // All devices disconnected
          onlineUsers.delete(userId);

          // Update user's last active timestamp
          try {
            await User.findByIdAndUpdate(userId, {
              lastActive: new Date()
            });
          } catch (error) {
            console.error('Error updating last active:', error);
          }

          // Emit offline status to all users
          io.emit('user:offline', {
            userId: userId,
            userName: userName,
            timestamp: new Date()
          });

          // Send updated online users list to remaining users
          const onlineUsersList = Array.from(onlineUsers.values()).map(u => ({
            userId: u.user._id.toString(),
            userName: u.user.name,
            role: u.user.role,
            lastSeen: u.lastSeen
          }));

          io.emit('users:online', onlineUsersList);
        }
      }
    });

    // Handle error
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'An error occurred' });
    });
  });

  // Return functions for external use
  return {
    // Send notification to specific user
    sendNotification: async (userId, notificationData) => {
      const userSession = onlineUsers.get(userId);
      if (userSession) {
        userSession.socketIds.forEach(id => {
          io.to(id).emit('notification:received', notificationData);
        });
      }
    },

    // Send notification to multiple users
    sendNotificationToUsers: async (userIds, notificationData) => {
      userIds.forEach(userId => {
        const userSession = onlineUsers.get(userId);
        if (userSession) {
          userSession.socketIds.forEach(id => {
            io.to(id).emit('notification:received', notificationData);
          });
        }
      });
    },

    // Send system message to all online users
    sendSystemMessage: (message) => {
      io.emit('system:message', {
        message,
        timestamp: new Date()
      });
    },

    // Get online users count
    getOnlineUsersCount: () => {
      return onlineUsers.size;
    },

    // Get online users list
    getOnlineUsers: () => {
      return Array.from(onlineUsers.values()).map(u => ({
        userId: u.user._id.toString(),
        userName: u.user.name,
        role: u.user.role,
        lastSeen: u.lastSeen
      }));
    },

    // Check if user is online
    isUserOnline: (userId) => {
      return onlineUsers.has(userId);
    }
  };
};
