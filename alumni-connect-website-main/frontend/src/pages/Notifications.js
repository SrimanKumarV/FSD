import React from 'react';
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
      default:
        break;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Bell className="w-6 h-6 mr-3 text-primary-600 dark:text-primary-400" />
            All Notifications
          </h2>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 dark:text-primary-400 rounded-xl transition-colors flex items-center"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="p-0">
          {(!notifications || notifications.length === 0) ? (
            <div className="py-16 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Notifications Yet</h3>
              <p className="text-gray-500 dark:text-gray-400">When you get notifications, they'll show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {notifications.map((notification) => (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={notification._id}
                  className={`p-6 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                    !notification.isRead ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-base text-gray-900 dark:text-white ${!notification.isRead ? 'font-bold' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-400 whitespace-nowrap ml-4">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                      </div>
                      <p className={`text-sm text-gray-600 dark:text-gray-300 mt-1 ${!notification.isRead ? 'font-medium' : ''}`}>
                        {notification.content}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="flex-shrink-0 self-center">
                        <span className="w-3 h-3 bg-primary-500 rounded-full inline-block shadow-sm"></span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Notifications;
