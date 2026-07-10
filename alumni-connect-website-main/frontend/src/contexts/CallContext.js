import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { callManager } from '../utils/CallManager';

const CallContext = createContext();

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be inside CallProvider');
  return ctx;
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  
  // Expose the CallManager state to React so UI can re-render
  const [callState, setCallState] = useState({
    status: 'idle',
    incomingCall: null,
    localStream: null,
    remoteStream: null,
    callInfo: null,
    elapsed: 0,
    isCalling: false,
  });

  // Initialize CallManager with socket and user
  useEffect(() => {
    if (socket && user) {
      callManager.init(socket, user);
    }
  }, [socket, user]);

  // Subscribe to CallManager state changes
  useEffect(() => {
    const unsubscribe = callManager.on((newState) => {
      setCallState({ ...newState });
    });
    return unsubscribe;
  }, []);

  // Expose CallManager methods and state to the rest of the app
  const value = {
    ...callState,
    callStatus: callState.status, // Map 'status' to 'callStatus' for backward compatibility
    startCall: (targetId, isVideo) => callManager.startCall(targetId, isVideo),
    acceptCall: () => callManager.acceptCall(),
    rejectCall: () => callManager.rejectCall(),
    endCall: (reason) => callManager.endCall(reason),
    toggleMute: () => callManager.toggleMute(),
    toggleVideo: () => callManager.toggleVideo(),
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
