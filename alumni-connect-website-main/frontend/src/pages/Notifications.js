import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    formatNotificationTime 
  } = useNotifications();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const TABS = [
    { id: 'all', label: 'All' },
    { id: 'social', label: 'Social' },
    { id: 'chat', label: 'Chat' },
    { id: 'system', label: 'System' }
  ];

  const filteredNotifications = notifications?.filter(notification => {
    if (activeTab === 'all') return true;
    switch (activeTab) {
      case 'social':
        return [
          'forum-reply', 'forum-like', 'forum_reply',
          'follow_request', 'follow_accept', 'follow_decline',
          'connection-request', 'connection-accepted', 'profile-view'
        ].includes(notification.type);
      case 'chat':
        return ['message-received'].includes(notification.type);
      case 'system':
        return [
          'system-announcement', 'admin-approval', 'admin-rejection',
          'account_approved', 'account_rejected', 'role_changed',
          'account_suspended', 'account_unsuspended'
        ].includes(notification.type);
      default:
        return true;
    }
  }) || [];

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    
    // Route based on notification type
    switch (notification.type) {
      case 'follow_request':
      case 'follow_accept':
      case 'follow_decline':
      case 'connection-request':
      case 'connection-accepted':
        navigate('/network');
        break;
      case 'forum-reply':
      case 'forum-like':
      case 'forum_reply':
        navigate('/forum');
        break;
      case 'message-received':
        navigate('/chat');
        break;
      case 'mentorship-request':
      case 'mentorship-accepted':
      case 'mentorship-rejected':
        navigate('/mentorship');
        break;
      case 'job-posted':
        navigate('/jobs');
        break;
      case 'event-reminder':
      case 'event-registration':
        navigate('/events');
        break;
      case 'contest-reminder':
      case 'contest-result':
        navigate('/contests');
        break;
      case 'activity-reminder':
      case 'activity-milestone':
      case 'activity-streak-warning':
      case 'activity-weekly-summary':
        navigate('/activity');
        break;
      default:
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 px-4 sm:px-6 lg:px-8 w-full pb-10 min-w-0">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden border border-gray-200/70 dark:border-gray-800 shadow-xs"
      >
        <div className="p-4 sm:p-5 border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                Notifications
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="px-3 py-1.5 text-xs font-semibold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/40 dark:text-primary-400 rounded-xl transition-colors flex items-center gap-1.5 border border-primary-200/60 dark:border-primary-800/40"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Categories Tab Switcher */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-gray-200/60 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/30">
          <div className="flex space-x-2 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          {filteredNotifications.length === 0 ? (
            <div className="py-12 px-4 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3 text-gray-400">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1">No notifications</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Updates and alerts will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification._id}
                  className={`px-4 sm:px-5 py-3 sm:py-3.5 transition-colors cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-800/40 ${
                    !notification.isRead ? 'bg-primary-50/30 dark:bg-primary-950/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-xs sm:text-sm text-gray-900 dark:text-white truncate ${!notification.isRead ? 'font-bold' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className={`text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed ${!notification.isRead ? 'font-medium' : ''}`}>
                        {notification.content}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="flex-shrink-0 self-center">
                        <span className="w-2 h-2 bg-primary-500 rounded-full inline-block"></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Notifications;
