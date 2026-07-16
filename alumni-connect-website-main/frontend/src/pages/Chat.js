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
  const [activeListTab, setActiveListTab] = useState('direct'); // 'direct' or 'group'
  const [newChatMode, setNewChatMode] = useState('dm'); // 'dm' or 'group'
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupEmails, setNewGroupEmails] = useState('');
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachment, setAttachment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  
  const emojis = ['😀', '😂', '🥰', '😎', '😭', '🥺', '😡', '👍', '❤️', '🔥', '✨', '🎉', '💡', '🚀', '👀', '💯'];

  // Lock body scroll to prevent page-level scrolling in Chat
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

  // Fetch user's chats
  const { data: chatsData, isLoading: chatsLoading } = useQuery(
    ['user-chats'],
    () => api.get('/messages/conversations'),
    { enabled: !!user }
  );

  const rawOtherParticipantId = selectedChat?.isGroup ? selectedChat._id : (selectedChat?.participants?.find(p => (p._id || p.id) !== (user?._id || user?.id))?._id || selectedChat?.participants?.find(p => (p._id || p.id) !== (user?._id || user?.id))?.id);
  const otherParticipantId = rawOtherParticipantId ? String(rawOtherParticipantId) : null;

  const { isCalling, callStatus, startCall } = useCall();




  // Fetch messages for selected chat using the stable participant ID
  const { data: messagesData, isLoading: messagesLoading } = useQuery(
    ['chat-messages', otherParticipantId],
    () => api.get(otherParticipantId === 'global' ? '/messages/global' : `/messages/conversation/${otherParticipantId}`),
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

  const createGroupMutation = useMutation(
    async (groupData) => {
      // Find user IDs for the emails
      const emails = groupData.emails.split(',').map(e => e.trim()).filter(Boolean);
      // Let's assume the backend takes emails or we resolve them. Wait, backend takes member IDs!
      // We will need a way to resolve emails to IDs or let backend do it.
      // Actually, since this is a quick fix, I will use an API call to resolve emails if I had one, or I can just pass emails.
      // Let's modify the backend group route to accept emails instead! Oh wait, I didn't. Let me just use users already in network or just post to a new custom endpoint.
      // Since I can't easily fetch users by email array right now without a new backend endpoint, I'll just change the frontend to send a string of emails and let backend resolve them, but my backend takes member IDs.
      // Let's update backend to handle emails in `members`. I'll do that in another tool call.
      return api.post('/messages/group', { name: groupData.name, emails: emails });
    },
    {
      onSuccess: (res) => {
        toast.success('Group created!');
        queryClient.invalidateQueries(['user-chats']);
        setShowNewChat(false);
        setNewGroupName('');
        setNewGroupEmails('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create group');
      }
    }
  );

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupEmails.trim()) return;
    createGroupMutation.mutate({ name: newGroupName, emails: newGroupEmails });
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
      const targetId = data.message.isGlobal ? 'global' : String(data.message.sender._id || data.message.sender);
      queryClient.setQueryData(['chat-messages', targetId], (oldData) => {
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
      const msgReceiverId = data.message.isGlobal ? 'global' : String(data.message.receiver?._id || data.message.receiver);
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

  const filteredChats = (chatsData?.data?.chats || []).filter(chat => {
    const matchSearch = chat.isGroup 
      ? chat.group?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      : chat.participants.some(participant => 
          (participant._id || participant.id) !== (user?._id || user?.id) && 
          participant.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
    if (activeListTab === 'direct') {
      return !chat.isGroup && matchSearch;
    } else {
      return chat.isGroup && matchSearch;
    }
  });

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
            <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2 mb-3">
                <button onClick={() => setNewChatMode('dm')} className={`flex-1 text-xs font-medium py-1.5 rounded-lg ${newChatMode === 'dm' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>Direct Message</button>
                <button onClick={() => setNewChatMode('group')} className={`flex-1 text-xs font-medium py-1.5 rounded-lg ${newChatMode === 'group' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>New Group</button>
              </div>
              
              {newChatMode === 'dm' ? (
                <form onSubmit={handleStartChat} className="flex space-x-2">
                  <input
                    type="email"
                    placeholder="User email..."
                    value={newChatEmail}
                    onChange={(e) => setNewChatEmail(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
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
              ) : (
                <form onSubmit={handleCreateGroup} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Group Name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Comma separated emails..."
                    value={newGroupEmails}
                    onChange={(e) => setNewGroupEmails(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white"
                    required
                  />
                  <button
                    type="submit"
                    disabled={createGroupMutation.isLoading}
                    className="w-full py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                  >
                    Create Group
                  </button>
                </form>
              )}
            </div>
          )}
          
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-3">
            <button
              onClick={() => setActiveListTab('direct')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors relative ${activeListTab === 'direct' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Direct
              {activeListTab === 'direct' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />}
            </button>
            <button
              onClick={() => setActiveListTab('group')}
              className={`flex-1 py-2 text-sm font-semibold transition-colors relative ${activeListTab === 'group' ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Groups
              {activeListTab === 'group' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />}
            </button>
          </div>

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
                    <div className="relative flex-shrink-0">
                      {chat.isGroup ? (
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium text-lg shadow-sm">
                          {chat.group?.name?.charAt(0)?.toUpperCase() || 'G'}
                        </div>
                      ) : (
                        otherParticipant?.photo && otherParticipant?.photo !== 'default-avatar.png' ? (
                          <img loading="lazy" src={otherParticipant.photo} alt={otherParticipant.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium text-lg shadow-sm">
                            {otherParticipant?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )
                      )}
                      {!chat.isGroup && (onlineUsersMap.has(String(otherParticipant?._id || otherParticipant?.id)) || otherParticipant?.isOnline) && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {chat.isGroup ? chat.group?.name : otherParticipant?.name}
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
                <div className="relative flex-shrink-0">
                  {selectedChat.isGroup ? (
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                      {selectedChat.group?.name?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                  ) : (
                    selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.photo && selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.photo !== 'default-avatar.png' ? (
                      <img loading="lazy" src={selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id)).photo} alt="avatar" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium shadow-sm">
                        {selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )
                  )}
                  {!selectedChat.isGroup && (onlineUsersMap.has(String(selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?._id || selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.id)) || selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.isOnline) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedChat.isGroup ? selectedChat.group?.name : selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {selectedChat.isGroup ? (
                      <span>{selectedChat.group?.members?.length} members</span>
                    ) : (onlineUsersMap.has(otherParticipantId) || selectedChat.participants.find(p => (p._id || p.id) !== (user?._id || user?.id))?.isOnline) ? (
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
                {!selectedChat.isGlobal && (
                  <>
                    <button 
                      onClick={() => startCall(otherParticipantId, false)}
                      disabled={isCalling || callStatus !== 'idle'}
                      className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all disabled:opacity-50"
                      title="Start Voice Call"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => startCall(otherParticipantId, true)}
                      disabled={isCalling || callStatus !== 'idle'}
                      className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all disabled:opacity-50"
                      title="Start Video Call"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                  </>
                )}
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
                  
                  const prevMsg = index > 0 ? array[index - 1] : null;
                  const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();
                  
                  const formatDaySeparator = (timestamp) => {
                    const date = new Date(timestamp);
                    const options = { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' };
                    return date.toLocaleDateString('en-GB', options).replace(',', '');
                  };
                  
                  return (
                    <React.Fragment key={msg._id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="px-4 py-1 bg-white/60 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-bold rounded-full shadow-sm backdrop-blur-md">
                            {formatDaySeparator(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <MessageBubble
                        message={msg}
                        isOwn={isOwn}
                        user={user}
                        isLastMessage={isLastMessage}
                        onReply={() => setReplyingTo(msg)}
                        onReact={(emoji) => socket.emit('message:react', { messageId: msg._id, emoji })}
                        onUnsend={() => socket.emit('message:unsend', { messageId: msg._id })}
                      />
                    </React.Fragment>
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
                    <img loading="lazy" src={attachment.fileUrl} alt="attachment" className="h-16 w-16 object-cover rounded" />
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
    const messageTime = new Date(timestamp);
    return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

      {/* Profile Icon for received message in WhatsApp group style */}
      {!isOwn && (
        <div className="flex-shrink-0 mr-2 mt-auto mb-1 hidden md:block">
          {message.sender?.photo && message.sender?.photo !== 'default-avatar.png' ? (
             <img src={message.sender.photo} alt="avatar" className="w-7 h-7 rounded-full object-cover shadow-sm" />
          ) : (
             <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 shadow-sm">
               {message.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
             </div>
          )}
        </div>
      )}

      <div className={`max-w-[75%] lg:max-w-md ${isOwn ? 'order-2' : 'order-1'} relative`}>
        
        {/* Reply Context Banner */}
        {message.replyTo && (
          <div className={`text-xs p-2 rounded-t-xl opacity-90 mb-[-8px] pb-3 ${isOwn ? 'bg-primary-700 dark:bg-primary-700 text-gray-200' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            <span className={`font-bold mr-1 ${isOwn ? 'text-primary-200' : 'text-primary-600 dark:text-primary-400'}`}>Replying to</span>
            <span className="truncate inline-block max-w-[150px] align-bottom">
              {message.replyTo.content || 'an attachment'}
            </span>
          </div>
        )}

        {/* The Bubble */}
        <div
          onClick={handleDoubleTap}
          className={`px-3 pt-2 pb-1.5 shadow-sm relative z-10 cursor-pointer select-none transition-transform active:scale-95 ${
            isOwn
              ? 'bg-primary-600 dark:bg-primary-600 text-white dark:text-white rounded-xl rounded-tr-none'
              : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white rounded-xl rounded-tl-none border border-gray-100 dark:border-gray-800'
          }`}
        >
          {!isOwn && (
             <div className="text-[11px] font-bold text-primary-600 dark:text-primary-400 mb-0.5">
               {message.sender?.name || 'User'}
             </div>
          )}
          
          {message.attachments && message.attachments.length > 0 && message.attachments[0].fileType === 'image' && (
            <div className="mb-1">
              <img loading="lazy" src={message.attachments[0].fileUrl} alt="attachment" className="rounded max-w-full h-auto object-cover max-h-48" />
            </div>
          )}
          {message.attachments && message.attachments.length > 0 && message.attachments[0].fileType !== 'image' && (
            <div className={`mb-1 p-2 rounded flex items-center gap-2 ${isOwn ? 'bg-primary-700 dark:bg-primary-700' : 'bg-gray-100 dark:bg-gray-700/50'}`}>
              <Paperclip className="w-4 h-4" />
              <a href={message.attachments[0].fileUrl} download={message.attachments[0].fileName} className="text-sm underline truncate max-w-[200px]">
                {message.attachments[0].fileName}
              </a>
            </div>
          )}
          
          {message.messageType === 'call-log' ? (
            <div className="flex items-center space-x-3 py-1 pr-12">
              <div className={`p-2 rounded-full ${isOwn ? 'bg-primary-700 dark:bg-primary-700' : 'bg-gray-200 dark:bg-gray-700'}`}>
                {JSON.parse(message.content).type === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {JSON.parse(message.content).status === 'missed' ? 'Missed Call' :
                   JSON.parse(message.content).status === 'rejected' ? 'Call Rejected' : 'Call Ended'}
                </span>
                <span className="text-xs opacity-80">
                  {JSON.parse(message.content).duration !== '0:00' ? `Duration: ${JSON.parse(message.content).duration}` : ''}
                </span>
              </div>
            </div>
          ) : (
            message.content && <p className="text-[14.5px] leading-snug whitespace-pre-wrap inline-block mr-14">
              {message.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => 
                part.match(/^https?:\/\//) ? (
                  <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={`hover:underline break-all ${isOwn ? 'text-primary-100' : 'text-blue-500'}`}>
                    {part}
                  </a>
                ) : part
              )}
            </p>
          )}

          {/* Timestamp - float right bottom */}
          <div className={`float-right -mt-2 -mr-1 ml-2 text-[10px] flex items-center space-x-0.5 ${isOwn ? 'text-primary-100/80 dark:text-primary-100/80' : 'text-gray-500/80 dark:text-gray-400/80'}`}>
            <span className="mt-2">{getMessageTime(message.createdAt)}</span>
            {isOwn && !message._id.toString().startsWith('temp_') && (
              <span className="ml-0.5 mt-2">
                {message.status === 'read' ? <CheckCheck className="w-[14px] h-[14px] text-white" /> : <Check className="w-[14px] h-[14px]" />}
              </span>
            )}
          </div>
          <div className="clear-both"></div>

          {/* Floating Reaction */}
          {hasHeartReaction && (
            <div className={`absolute -bottom-3 ${isOwn ? 'left-2' : 'right-2'} bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-full p-0.5 text-xs z-20`}>
              ❤️
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Chat;
