import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Image, 
  Paperclip,
  Smile,
  Mic,
  User,
  Circle,
  Check,
  CheckCheck,
  Clock,
  Edit,
  Trash2,
  X,
  Block,
  Report,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../utils/api';
import { useCall } from '../contexts/CallContext';

const Chat = () => {
  const { user } = useAuth();
  const { socket, isConnected, onlineUsersMap } = useSocket();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachment, setAttachment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  
  const emojis = ['😀', '😂', '🥰', '😎', '😭', '🥺', '😡', '👍', '❤️', '🔥', '✨', '🎉', '💡', '🚀', '👀', '💯'];

  // Fetch user's chats
  const { data: chatsData, isLoading: chatsLoading } = useQuery(
    ['user-chats'],
    () => api.get('/messages/conversations'),
    { enabled: !!user }
  );

  const rawOtherParticipantId = selectedChat?.participants?.find(p => (p._id || p.id) !== (user?._id || user?.id))?._id || selectedChat?.participants?.find(p => (p._id || p.id) !== (user?._id || user?.id))?.id;
  const otherParticipantId = rawOtherParticipantId ? String(rawOtherParticipantId) : null;

  // WebRTC Hook
  const { isCalling, callStatus, startCall } = useCall();

  // Fetch messages for selected chat using the stable participant ID
  const { data: messagesData, isLoading: messagesLoading } = useQuery(
    ['chat-messages', otherParticipantId],
    () => api.get(`/messages/conversation/${otherParticipantId}`),
    { enabled: !!otherParticipantId }
  );

  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState('');

  const startChatMutation = useMutation(
    (email) => api.post('/messages/start-chat', { email }),
    {
      onSuccess: (res) => {
        const { targetUser } = res.data;
        const newChat = {
          _id: `temp_${targetUser._id}`,
          participants: [user, targetUser],
          lastMessage: null,
          unreadCount: 0
        };
        setSelectedChat(newChat);
        setShowNewChat(false);
        setNewChatEmail('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to start chat');
      }
    }
  );

  const handleStartChat = (e) => {
    e.preventDefault();
    if (!newChatEmail.trim()) return;
    startChatMutation.mutate(newChatEmail.trim());
  };

  const startedChatRef = useRef('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const startChatEmail = searchParams.get('startChat');
    
    if (startChatEmail && startedChatRef.current !== startChatEmail) {
      startedChatRef.current = startChatEmail;
      startChatMutation.mutate(startChatEmail);
      // Remove query param
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (location.state?.startChatWith && startedChatRef.current !== location.state.startChatWith) {
      startedChatRef.current = location.state.startChatWith;
      startChatMutation.mutate(location.state.startChatWith);
      // Clear the state so it doesn't trigger again on reload
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.startChatWith, location.search]);

  // Send message mutation (fallback if socket fails)
  const sendMessageMutation = useMutation(
    (messageData) => api.post('/messages', messageData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chat-messages', otherParticipantId]);
        queryClient.invalidateQueries(['user-chats']);
        setMessage('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    }
  );

  // Auto-update selectedChat if the backend returns a real ID after sending a message
  useEffect(() => {
    if (selectedChat?._id?.startsWith('temp_') && chatsData?.data?.chats) {
      const realChat = chatsData.data.chats.find(c => {
        const cOther = c.participants.find(p => (p._id || p.id) !== (user?._id || user?.id));
        return (cOther?._id || cOther?.id) === otherParticipantId;
      });
      if (realChat && realChat._id !== selectedChat._id) {
        setSelectedChat(realChat);
      }
    }
  }, [chatsData, selectedChat, otherParticipantId, user]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessageReceived = (data) => {
      const senderId = String(data.message.sender._id || data.message.sender);
      queryClient.setQueryData(['chat-messages', senderId], (oldData) => {
        if (!oldData || !oldData.data) return oldData;
        const messages = oldData.data.messages || [];
        if (messages.some(msg => msg._id === data.message._id)) return oldData;
        return {
          ...oldData,
          data: { ...oldData.data, messages: [data.message, ...messages] }
        };
      });
      queryClient.invalidateQueries(['user-chats']);
    };

    const handleMessageSent = (data) => {
      const msgReceiverId = String(data.message.receiver._id || data.message.receiver);
      if (msgReceiverId !== otherParticipantId) return;

      queryClient.setQueryData(['chat-messages', otherParticipantId], (oldData) => {
        if (!oldData || !oldData.data) return oldData;
        const messages = [...(oldData.data.messages || [])];
        
        // Always remove ALL temporary optimistic messages
        const cleanMessages = messages.filter(msg => !msg._id.toString().startsWith('temp_'));
        
        // Only add the real message if it's not already in the clean list
        if (!cleanMessages.some(msg => msg._id === data.message._id)) {
          cleanMessages.unshift(data.message);
        }
        
        return {
          ...oldData,
          data: { ...oldData.data, messages: cleanMessages }
        };
      });
      queryClient.invalidateQueries(['user-chats']);
      setMessage('');
    };

    const handleTypingStart = (data) => {
      if (otherParticipantId === data.userId) {
        setIsTyping(true);
      }
    };

    const handleTypingStop = (data) => {
      if (otherParticipantId === data.userId) {
        setIsTyping(false);
      }
    };

    const handleMessageReacted = (data) => {
      queryClient.setQueryData(['chat-messages', otherParticipantId], (oldData) => {
        if (!oldData || !oldData.data) return oldData;
        const messages = oldData.data.messages.map(msg => 
          msg._id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        );
        return { ...oldData, data: { ...oldData.data, messages } };
      });
    };

    const handleMessageUnsent = (data) => {
      queryClient.setQueryData(['chat-messages', otherParticipantId], (oldData) => {
        if (!oldData || !oldData.data) return oldData;
        const messages = oldData.data.messages.map(msg => 
          msg._id === data.messageId ? { ...msg, metadata: { ...msg.metadata, isDeleted: true } } : msg
        );
        return { ...oldData, data: { ...oldData.data, messages } };
      });
    };

    socket.on('message:received', handleMessageReceived);
    socket.on('message:sent', handleMessageSent);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:reacted', handleMessageReacted);
    socket.on('message:unsent', handleMessageUnsent);

    return () => {
      socket.off('message:received', handleMessageReceived);
      socket.off('message:sent', handleMessageSent);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:reacted', handleMessageReacted);
      socket.off('message:unsent', handleMessageUnsent);
    };
  }, [socket, isConnected, otherParticipantId, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.data?.messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if ((!message.trim() && !attachment) || !selectedChat || !otherParticipantId) return;

    const payload = {
      receiverId: otherParticipantId,
      content: attachment ? (message.trim() || 'Sent an attachment') : message.trim(),
      messageType: attachment?.fileType === 'image' ? 'image' : (attachment ? 'file' : 'text'),
      attachments: attachment ? [attachment] : [],
      replyTo: replyingTo?._id
    };

    if (socket && isConnected) {
      // Zero-latency optimistic UI update
      const tempMessage = {
        _id: 'temp_' + Date.now(),
        sender: user?._id || user?.id,
        receiver: otherParticipantId,
        content: payload.content,
        messageType: payload.messageType,
        attachments: payload.attachments,
        replyTo: replyingTo,
        createdAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(['chat-messages', otherParticipantId], (oldData) => {
        if (!oldData || !oldData.data) return oldData;
        const messages = oldData.data.messages || [];
        return {
          ...oldData,
          data: { ...oldData.data, messages: [tempMessage, ...messages] }
        };
      });

      socket.emit('message:send', payload);
      setMessage('');
      setAttachment(null);
      setReplyingTo(null);
    } else {
      const messageData = {
        receiver: otherParticipantId,
        ...payload
      };
      delete messageData.receiverId;
      sendMessageMutation.mutate(messageData);
      setAttachment(null);
      setReplyingTo(null);
    }

    // Emit typing stop
    if (socket && isConnected) {
      socket.emit('typing:stop', { receiverId: otherParticipantId });
    }
  };

  const handleTyping = () => {
    if (socket && isConnected && otherParticipantId) {
      socket.emit('typing:start', { receiverId: otherParticipantId });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({
        fileUrl: reader.result,
        fileName: file.name,
        fileType: file.type.startsWith('image/') ? 'image' : 'file',
        fileSize: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const filteredChats = chatsData?.data?.chats?.filter(chat => 
    chat.participants.some(participant => 
      (participant._id || participant.id) !== (user?._id || user?.id) && 
      participant.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  if (chatsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex overflow-hidden border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 relative">
      {/* Sidebar - Chat List */}
      <div className={`w-full md:w-80 border-r border-gray-200 dark:border-gray-700/50 flex flex-col bg-white/50 dark:bg-gray-900/50 ${!showChatList ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="p-2 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40 rounded-xl transition-all"
            >
              <Edit className="w-5 h-5" />
            </button>
          </div>
          {showNewChat && (
            <form onSubmit={handleStartChat} className="mb-4 flex space-x-2">
              <input
                type="email"
                placeholder="User email..."
                value={newChatEmail}
                onChange={(e) => setNewChatEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
                required
              />
              <button
                type="submit"
                disabled={startChatMutation.isLoading}
                className="px-3 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
              >
                Start
              </button>
            </form>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const otherParticipant = chat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id));
              const lastMessage = chat.lastMessage;
              const isUnread = chat.unreadCount > 0;
              const isSelected = selectedChat?._id === chat._id;

              return (
                <div
                  key={chat._id}
                  onClick={() => {
                    setSelectedChat(chat);
                    setShowChatList(false);
                  }}
                  className={`p-4 border-b border-gray-100 dark:border-gray-800/50 cursor-pointer hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all ${
                    isSelected ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-alumni-500 rounded-full flex items-center justify-center text-white font-medium">
                        {otherParticipant?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      {(onlineUsersMap.has(String(otherParticipant?._id || otherParticipant?.id)) || otherParticipant?.isOnline) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {otherParticipant?.name}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {new Date(lastMessage.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate pr-2">
                          {lastMessage ? (
                            <span className="flex items-center">
                              {lastMessage.sender === (user?._id || user?.id) && (
                                <span className="mr-1">
                                  {lastMessage.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3 text-gray-400" />}
                                </span>
                              )}
                              {lastMessage.messageType === 'call-log' 
                                ? (() => {
                                    try {
                                      const log = JSON.parse(lastMessage.content);
                                      return log.status === 'missed' ? 'Missed Call' :
                                             log.status === 'rejected' ? 'Call Rejected' : 'Call Ended';
                                    } catch(e) { return 'Call'; }
                                  })()
                                : lastMessage.content}
                            </span>
                          ) : (
                            'No messages yet'
                          )}
                        </p>
                        {isUnread && (
                          <span className="ml-2 w-2 h-2 bg-primary-600 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex-col bg-white/40 dark:bg-gray-900/40 relative ${showChatList ? 'hidden md:flex' : 'flex'}`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setShowChatList(true)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-alumni-500 rounded-full flex items-center justify-center text-white font-medium">
                    {selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  {(onlineUsersMap.has(String(selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?._id || selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.id)) || selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.isOnline) && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {(onlineUsersMap.has(otherParticipantId) || selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.isOnline) ? (
                      <span className="text-green-500">Active now</span>
                    ) : (
                      <span>{(() => {
                        const otherP = selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id));
                        if (!otherP?.lastSeen) return 'Offline';
                        const date = new Date(otherP.lastSeen);
                        const diffInMins = Math.floor((new Date() - date) / (1000 * 60));
                        if (diffInMins < 1) return 'Active just now';
                        if (diffInMins < 60) return `Active ${diffInMins}m ago`;
                        const diffInHours = Math.floor(diffInMins / 60);
                        if (diffInHours < 24) return `Active ${diffInHours}h ago`;
                        return `Active ${date.toLocaleDateString()}`;
                      })()}</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => startCall(otherParticipantId, false)}
                  disabled={isCalling || callStatus !== 'idle'}
                  className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all disabled:opacity-50"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => startCall(otherParticipantId, true)}
                  disabled={isCalling || callStatus !== 'idle'}
                  className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all disabled:opacity-50"
                >
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>


            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : messagesData?.data?.messages?.length > 0 ? (
                [...messagesData.data.messages].reverse().map((msg, index, array) => {
                  const isOwn = msg.sender === (user?._id || user?.id) || msg.sender?._id === (user?._id || user?.id);
                  const isLastMessage = index === array.length - 1;
                  
                  return (
                    <MessageBubble
                      key={msg._id}
                      message={msg}
                      isOwn={isOwn}
                      user={user}
                      isLastMessage={isLastMessage}
                      onReply={() => setReplyingTo(msg)}
                      onReact={(emoji) => socket.emit('message:react', { messageId: msg._id, emoji })}
                      onUnsend={() => socket.emit('message:unsend', { messageId: msg._id })}
                    />
                  );
                })
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8 flex flex-col items-center justify-center h-full">
                  <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10 relative">
              
              {replyingTo && (
                <div className="absolute bottom-full left-4 right-4 mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-t-xl border-l-4 border-primary-500 flex justify-between items-center shadow-sm">
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-bold mb-1">
                      Replying to {replyingTo.sender?._id === user?._id ? 'yourself' : (replyingTo.sender?.name || 'user')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {replyingTo.content || 'Attachment'}
                    </p>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {attachment && (
                <div className="absolute bottom-full left-4 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  {attachment.fileType === 'image' ? (
                    <img src={attachment.fileUrl} alt="attachment" className="h-16 w-16 object-cover rounded" />
                  ) : (
                    <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-gray-500">File</div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{attachment.fileName}</span>
                    <button type="button" onClick={() => setAttachment(null)} className="text-xs text-red-500 hover:text-red-700 text-left mt-1">Remove</button>
                  </div>
                </div>
              )}
              {showEmojiPicker && (
                <div className="absolute bottom-full right-4 mb-2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-64">
                  <div className="grid grid-cols-8 gap-2">
                    {emojis.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setMessage(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded text-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  accept="image/*,.pdf,.doc,.docx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                >
                  <Image className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-xl transition-all ${showEmojiPicker ? 'text-primary-600 bg-primary-50 dark:text-primary-400 dark:bg-primary-900/20' : 'text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'}`}
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type your message..."
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!message.trim() && !attachment}
                  className="p-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all ml-1"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <MessageSquare className="w-10 h-10 text-primary-400 dark:text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a conversation</h3>
              <p className="text-gray-600 dark:text-gray-400">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

// Message Bubble Component (Instagram Style)
const MessageBubble = ({ message, isOwn, user, isLastMessage, onReply, onReact, onUnsend }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [lastTap, setLastTap] = useState(0);

  const getMessageTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  const handleDoubleTap = (e) => {
    e.preventDefault();
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      if (!isOwn) onReact('❤️'); // Instagram double tap to heart
    } else {
      setLastTap(now);
    }
  };

  const hasHeartReaction = message.reactions?.some(r => r.emoji === '❤️');

  if (message.metadata?.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="px-4 py-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-transparent text-gray-400 dark:text-gray-500 italic text-sm">
          This message was unsent.
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group relative`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      
      {/* Options Menu (Reply, Unsend) */}
      <AnimatePresence>
        {showOptions && !message._id.toString().startsWith('temp_') && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute top-1/2 -translate-y-1/2 flex items-center space-x-1 ${isOwn ? 'right-[105%]' : 'left-[105%]'}`}
          >
            <button 
              onClick={onReply}
              className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors shadow-sm"
              title="Reply"
            >
              <Edit className="w-4 h-4" />
            </button>
            {isOwn && (
              <button 
                onClick={onUnsend}
                className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full text-gray-500 hover:text-red-500 transition-colors shadow-sm"
                title="Unsend"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'} relative`}>
        
        {/* Reply Context Banner */}
        {message.replyTo && (
          <div className={`text-xs p-2 rounded-t-xl opacity-75 mb-[-8px] pb-3 ${isOwn ? 'bg-primary-700 text-primary-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            <span className="font-bold mr-1">Replying to</span>
            <span className="truncate inline-block max-w-[150px] align-bottom">
              {message.replyTo.content || 'an attachment'}
            </span>
          </div>
        )}

        {/* The Bubble */}
        <div
          onClick={handleDoubleTap}
          className={`px-4 py-2.5 shadow-sm relative z-10 cursor-pointer select-none transition-transform active:scale-95 ${
            isOwn
              ? 'bg-gradient-to-tr from-primary-600 to-primary-500 text-white rounded-2xl rounded-br-sm'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm'
          }`}
        >
          {message.attachments && message.attachments.length > 0 && message.attachments[0].fileType === 'image' && (
            <div className="mb-2">
              <img src={message.attachments[0].fileUrl} alt="attachment" className="rounded-lg max-w-full h-auto object-cover max-h-48" />
            </div>
          )}
          {message.attachments && message.attachments.length > 0 && message.attachments[0].fileType !== 'image' && (
            <div className={`mb-2 p-2 rounded flex items-center gap-2 ${isOwn ? 'bg-primary-700' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <Paperclip className="w-4 h-4" />
              <a href={message.attachments[0].fileUrl} download={message.attachments[0].fileName} className="text-sm underline truncate max-w-[200px]">
                {message.attachments[0].fileName}
              </a>
            </div>
          )}
          
          {message.messageType === 'call-log' ? (
            <div className="flex items-center space-x-3 py-1">
              <div className={`p-2 rounded-full ${isOwn ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                {JSON.parse(message.content).type === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">
                  {JSON.parse(message.content).status === 'missed' ? 'Missed Call' :
                   JSON.parse(message.content).status === 'rejected' ? 'Call Rejected' : 'Call Ended'}
                </span>
                <span className="text-xs opacity-80">
                  {JSON.parse(message.content).duration !== '0:00' ? `Duration: ${JSON.parse(message.content).duration}` : ''}
                </span>
              </div>
            </div>
          ) : (
            message.content && <p className="text-[15px] leading-relaxed">{message.content}</p>
          )}

          {/* Floating Reaction */}
          {hasHeartReaction && (
            <div className={`absolute -bottom-3 ${isOwn ? 'left-2' : 'right-2'} bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 rounded-full p-1 text-sm z-20`}>
              ❤️
            </div>
          )}
        </div>

        {/* Read Receipt (Instagram Style) */}
        {isOwn && isLastMessage && message.status === 'read' && !message._id.toString().startsWith('temp_') && (
          <div className="flex justify-end mt-1">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Seen</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Chat;
