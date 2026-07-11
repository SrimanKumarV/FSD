import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext();

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be inside CallProvider');
  return ctx;
};

export const CallProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  const [callStatus, setCallStatus] = useState('idle'); // idle | ringing | outgoing | connected
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, roomName, isVideo }
  const [callInfo, setCallInfo] = useState(null); // { targetId, roomName, isVideo }
  
  const ringtoneRef = useRef(null);

  useEffect(() => {
    // Initialize ringtone
    ringtoneRef.current = new Audio('/ringtone.mp3');
    ringtoneRef.current.loop = true;
  }, []);

  const playRingtone = () => {
    ringtoneRef.current?.play().catch(e => console.warn('Autoplay prevented ringtone:', e));
  };

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIncoming = (data) => {
      console.log('[CallContext] Incoming call:', data);
      if (callStatus !== 'idle') {
        socket.emit('call:end', { targetId: data.callerId, reason: 'busy' });
        return;
      }
      setIncomingCall(data);
      setCallStatus('ringing');
      playRingtone();
    };

    const handleAccepted = () => {
      console.log('[CallContext] Call accepted by remote');
      stopRingtone();
      setCallStatus('connected');
    };

    const handleEnded = ({ reason }) => {
      console.log('[CallContext] Call ended by remote. Reason:', reason);
      resetCall();
    };

    const handleError = (data) => {
      console.error('[CallContext] Call error:', data);
      resetCall();
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:ended', handleEnded);
    socket.on('call:error', handleError);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:ended', handleEnded);
      socket.off('call:error', handleError);
    };
  }, [socket, isConnected, callStatus]);

  const resetCall = () => {
    stopRingtone();
    setCallStatus('idle');
    setIncomingCall(null);
    setCallInfo(null);
  };

  const startCall = (targetId, isVideo = true) => {
    if (!socket || !targetId || callStatus !== 'idle') return;
    
    const roomName = `AlumnexConnect_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    setCallInfo({ targetId, roomName, isVideo });
    setCallStatus('outgoing');
    
    socket.emit('call:request', {
      receiverId: targetId,
      callerName: user?.name || 'Unknown',
      roomName,
      isVideo
    });
  };

  const acceptCall = () => {
    if (!incomingCall || !socket) return;
    
    setCallInfo({ 
      targetId: incomingCall.callerId, 
      roomName: incomingCall.roomName, 
      isVideo: incomingCall.isVideo 
    });
    setCallStatus('connected');
    stopRingtone();
    
    socket.emit('call:answer', {
      callerId: incomingCall.callerId
    });
    setIncomingCall(null);
  };

  const rejectCall = () => {
    if (!incomingCall || !socket) return;
    socket.emit('call:end', { targetId: incomingCall.callerId, reason: 'rejected' });
    resetCall();
  };

  const endCall = (reason = 'ended') => {
    const targetId = callInfo?.targetId || incomingCall?.callerId;
    if (targetId && socket) {
      socket.emit('call:end', { targetId, reason });
      
      // If we initiated and they didn't answer
      if (callStatus === 'outgoing') {
        socket.emit('message:send', {
          receiverId: targetId,
          content: JSON.stringify({ type: callInfo?.isVideo ? 'video' : 'audio', status: 'missed', duration: '0:00' }),
          messageType: 'call-log',
        });
      }
    }
    resetCall();
  };

  const value = {
    callStatus,
    isCalling: callStatus !== 'idle',
    incomingCall,
    callInfo,
    startCall,
    acceptCall,
    rejectCall,
    endCall
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
