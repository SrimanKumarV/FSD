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
  Block,
  Report,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../utils/api';

const Chat = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch user's chats
  const { data: chatsData, isLoading: chatsLoading } = useQuery(
    ['user-chats'],
    () => api.get('/messages/conversations'),
    { enabled: !!user }
  );

  const otherParticipantId = selectedChat?.participants?.find(p => (p._id || p.id) !== (user?._id || user?.id))?._id || selectedChat?.participants?.find(p => (p._id || p.id) !== (user?._id || user?.id))?.id;

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

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const startChatEmail = searchParams.get('startChat');
    
    if (startChatEmail) {
      startChatMutation.mutate(startChatEmail);
      // Remove query param
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (location.state?.startChatWith) {
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
    if (selectedChat?._id?.startsWith('temp_') && chatsData?.chats) {
      const realChat = chatsData.chats.find(c => {
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
      const senderId = data.message.sender._id || data.message.sender;
      queryClient.invalidateQueries(['chat-messages', senderId]);
      queryClient.invalidateQueries(['user-chats']);
    };

    const handleMessageSent = (data) => {
      const receiverId = data.message.receiver._id || data.message.receiver;
      queryClient.invalidateQueries(['chat-messages', receiverId]);
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

    socket.on('message:received', handleMessageReceived);
    socket.on('message:sent', handleMessageSent);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    return () => {
      socket.off('message:received', handleMessageReceived);
      socket.off('message:sent', handleMessageSent);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, isConnected, otherParticipantId, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat || !otherParticipantId) return;

    if (socket && isConnected) {
      socket.emit('message:send', {
        receiverId: otherParticipantId,
        content: message.trim(),
        messageType: 'text'
      });
      // Fallback optimistic UI clear
      setMessage('');
    } else {
      const messageData = {
        receiver: otherParticipantId,
        content: message.trim(),
        messageType: 'text'
      };
      sendMessageMutation.mutate(messageData);
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

  const filteredChats = chatsData?.chats?.filter(chat => 
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="h-[calc(100vh-10rem)] glass-card rounded-3xl flex overflow-hidden">
      {/* Sidebar - Chat List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700/50 flex flex-col bg-white/50 dark:bg-gray-900/50">
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
                  onClick={() => setSelectedChat(chat)}
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
                      {otherParticipant?.isOnline && (
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
                                  {lastMessage.read ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3 text-gray-400" />}
                                </span>
                              )}
                              {lastMessage.content}
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
      <div className="flex-1 flex flex-col bg-white/40 dark:bg-gray-900/40 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700/50 flex items-center justify-between bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-alumni-500 rounded-full flex items-center justify-center text-white font-medium">
                    {selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  {selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.isOnline ? (
                      <span className="text-green-500">Online</span>
                    ) : 'Offline'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all">
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
              ) : messagesData?.messages?.length > 0 ? (
                messagesData.messages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    isOwn={msg.sender === (user?._id || user?.id)}
                    user={user}
                  />
                ))
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
            <div className="p-4 border-t border-gray-200 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-10">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <button
                  type="button"
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
                  className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
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
                  type="button"
                  className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                >
                  <Mic className="w-5 h-5" />
                </button>
                
                <button
                  type="submit"
                  disabled={!message.trim()}
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
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, isOwn, user }) => {
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

  const getReadStatus = () => {
    if (!isOwn) return null;
    
    if (message.read) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm ${
            isOwn
              ? 'bg-primary-600 text-white rounded-br-sm'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-sm'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 dark:text-gray-400 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span>{getMessageTime(message.createdAt)}</span>
          {getReadStatus()}
        </div>
      </div>
    </motion.div>
  );
};

export default Chat;
