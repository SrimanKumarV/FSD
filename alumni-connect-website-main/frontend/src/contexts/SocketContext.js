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

    const userId = user._id || user.id;

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

    let fallbackAttempted = false;

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      
      // Socket Failover Logic
      const backupUrl = process.env.REACT_APP_BACKUP_API_URL;
      if (!fallbackAttempted && backupUrl) {
        fallbackAttempted = true;
        const backupSocketUrl = backupUrl.replace(/\/api$/, '');
        console.warn(`Socket failed to connect, failing over to backup: ${backupSocketUrl}`);
        
        // Update the socket URL and attempt to reconnect manually
        newSocket.io.uri = backupSocketUrl;
        setTimeout(() => {
          newSocket.connect();
        }, 1000); // Wait 1 second before trying to connect to backup
      }
    });

    // Join user to their personal room
    newSocket.on('connect', () => {
      if (userId) {
        newSocket.emit('join-user-room', { userId: userId });
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
      const userId = user._id || user.id;
      socket.emit('user:back');
      
      // Handle page visibility change
      const handleVisibilityChange = () => {
        if (document.hidden) {
          socket.emit('user:away');
        } else {
          socket.emit('user:back');
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Handle beforeunload
      const handleBeforeUnload = () => {
        // Disconnect handled by socket.io automatically on unload
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
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
