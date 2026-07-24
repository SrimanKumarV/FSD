import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery(
    ['notifications'],
    () => api.get('/notifications'),
    { 
      enabled: !!user,
      refetchInterval: 30000, // Refetch every 30 seconds
      onSuccess: (data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter(n => !n.read).length || 0);
      }
    }
  );

  // Mark notification as read
  const markAsReadMutation = useMutation(
    (notificationId) => api.put(`/notifications/${notificationId}/read`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
      }
    }
  );

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation(
    () => api.put('/notifications/read-all'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
      }
    }
  );

  // Delete notification
  const deleteNotificationMutation = useMutation(
    (notificationId) => api.delete(`/notifications/${notificationId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
      }
    }
  );

  // Socket event handlers for real-time notifications
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new notifications
    socket.on('new-notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      toast(notification.message, {
        icon: getNotificationIcon(notification.type),
        duration: 5000,
        position: 'top-right',
      });
    });

    // Listen for notification updates
    socket.on('notification-updated', (updatedNotification) => {
      setNotifications(prev => 
        prev.map(n => 
          n._id === updatedNotification._id ? updatedNotification : n
        )
      );
      
      if (updatedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });

    return () => {
      socket.off('new-notification');
      socket.off('notification-updated');
    };
  }, [socket, isConnected]);

  // Helper function to get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  // Helper function to get notification color
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Format notification time
  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return notificationTime.toLocaleDateString();
  };

  // Group notifications by date
  const groupNotificationsByDate = (notifications) => {
    const groups = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });

    return Object.entries(groups).map(([date, notifications]) => ({
      date,
      notifications: notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }));
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  const value = {
    notifications,
    groupedNotifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    getNotificationColor,
    formatNotificationTime,
    isMarkingAsRead: markAsReadMutation.isLoading,
    isMarkingAllAsRead: markAllAsReadMutation.isLoading,
    isDeleting: deleteNotificationMutation.isLoading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
