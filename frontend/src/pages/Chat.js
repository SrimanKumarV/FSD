import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
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
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch user's chats
  const { data: chatsData, isLoading: chatsLoading } = useQuery(
    ['user-chats'],
    () => api.get('/messages/chats'),
    { enabled: !!user }
  );

  // Fetch messages for selected chat
  const { data: messagesData, isLoading: messagesLoading } = useQuery(
    ['chat-messages', selectedChat?._id],
    () => api.get(`/messages/${selectedChat?._id}`),
    { enabled: !!selectedChat?._id }
  );

  // Send message mutation
  const sendMessageMutation = useMutation(
    (messageData) => api.post('/messages', messageData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['chat-messages', selectedChat?._id]);
        queryClient.invalidateQueries(['user-chats']);
        setMessage('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send message');
      }
    }
  );

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new messages
    socket.on('new-message', (data) => {
      if (data.chatId === selectedChat?._id) {
        queryClient.invalidateQueries(['chat-messages', selectedChat?._id]);
      }
      queryClient.invalidateQueries(['user-chats']);
    });

    // Listen for typing indicators
    socket.on('user-typing', (data) => {
      if (data.chatId === selectedChat?._id && data.userId !== user?.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    return () => {
      socket.off('new-message');
      socket.off('user-typing');
    };
  }, [socket, isConnected, selectedChat, user, queryClient]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    const messageData = {
      chatId: selectedChat._id,
      content: message.trim(),
      type: 'text'
    };

    sendMessageMutation.mutate(messageData);

    // Emit typing stop
    if (socket && isConnected) {
      socket.emit('stop-typing', { chatId: selectedChat._id });
    }
  };

  const handleTyping = () => {
    if (socket && isConnected && selectedChat) {
      socket.emit('typing', { chatId: selectedChat._id });
    }
  };

  const filteredChats = chatsData?.chats?.filter(chat => 
    chat.participants.some(participant => 
      participant._id !== user?.id && 
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
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 flex">
      {/* Sidebar - Chat List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length > 0 ? (
            filteredChats.map((chat) => {
              const otherParticipant = chat.participants.find(p => p._id !== user?.id);
              const lastMessage = chat.lastMessage;
              const isUnread = chat.unreadCount > 0;
              const isSelected = selectedChat?._id === chat._id;

              return (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-primary-50 border-primary-200' : ''
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
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {otherParticipant?.name}
                        </h3>
                        {lastMessage && (
                          <span className="text-xs text-gray-500">
                            {new Date(lastMessage.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {lastMessage ? (
                            <span className="flex items-center">
                              {lastMessage.sender === user?.id && (
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
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-alumni-500 rounded-full flex items-center justify-center text-white font-medium">
                    {selectedChat.participants.find(p => p._id !== user?.id)?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  {selectedChat.participants.find(p => p._id !== user?.id)?.isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedChat.participants.find(p => p._id !== user?.id)?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedChat.participants.find(p => p._id !== user?.id)?.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
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
                    isOwn={msg.sender === user?.id}
                    user={user}
                  />
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center space-x-2 text-gray-500 text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span>typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Image className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
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
                    placeholder="Type a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <button
                  type="button"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <Mic className="w-5 h-5" />
                </button>
                
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a chat from the sidebar to start messaging</p>
            </div>
          </div>
        )}
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
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-primary-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-900 rounded-bl-none'
          }`}
        >
          <p className="text-sm">{message.content}</p>
        </div>
        <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span>{getMessageTime(message.createdAt)}</span>
          {getReadStatus()}
        </div>
      </div>
    </motion.div>
  );
};

export default Chat;
