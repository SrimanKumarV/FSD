import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsersMap, setOnlineUsersMap] = useState(new Map());
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const defaultSocketUrl = apiUrl.replace(/\/api$/, '');
    const socketUrl = process.env.REACT_APP_SOCKET_URL || defaultSocketUrl;
    
    const newSocket = io(socketUrl, {
      auth: {
        token: localStorage.getItem('token')
      },
      transports: ['websocket', 'polling']
    });

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Join user to their personal room
    newSocket.on('connect', () => {
      if (user?._id) {
        newSocket.emit('join-user-room', { userId: user._id });
        newSocket.emit('get:users:online');
      }
    });
    
    // Online users status handlers
    newSocket.on('users:online', (users) => {
      const map = new Map();
      users.forEach(u => map.set(u.userId, true));
      setOnlineUsersMap(map);
    });
    
    newSocket.on('user:online', (data) => {
      setOnlineUsersMap(prev => new Map(prev).set(data.userId, true));
    });
    
    newSocket.on('user:offline', (data) => {
      setOnlineUsersMap(prev => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Emit user status updates
  useEffect(() => {
    if (socket && user) {
      socket.emit('user-online', { userId: user._id });
      
      // Handle page visibility change
      const handleVisibilityChange = () => {
        if (document.hidden) {
          socket.emit('user-away', { userId: user._id });
        } else {
          socket.emit('user-online', { userId: user._id });
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Handle beforeunload
      const handleBeforeUnload = () => {
        socket.emit('user-offline', { userId: user._id });
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        socket.emit('user-offline', { userId: user._id });
      };
    }
  }, [socket, user]);

  const value = {
    socket,
    isConnected,
    onlineUsersMap,
    // Helper functions
    emit: (event, data) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      }
    },
    on: (event, callback) => {
      if (socket) {
        socket.on(event, callback);
      }
    },
    off: (event, callback) => {
      if (socket) {
        socket.off(event, callback);
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
