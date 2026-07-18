import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import Peer from 'simple-peer';

const CallContext = createContext();

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be inside CallProvider');
  return ctx;
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export const CallProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  const [callStatus, setCallStatus] = useState('idle'); // idle | ringing | outgoing | connected
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, isVideo }
  const [callInfo, setCallInfo] = useState(null); // { targetId, isVideo }
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteStreamTrigger, setRemoteStreamTrigger] = useState(0);
  
  const peerRef = useRef(null);
  const ringtoneRef = useRef(null);
  
  // Keep refs for state used inside socket callbacks to avoid re-binding listeners
  const callInfoRef = useRef(null);
  const incomingCallRef = useRef(null);
  const localStreamRef = useRef(null);
  const callStatusRef = useRef('idle');

  useEffect(() => { callInfoRef.current = callInfo; }, [callInfo]);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);

  useEffect(() => {
    ringtoneRef.current = new Audio('/ringtone.mp3');
    ringtoneRef.current.loop = true;
    return () => {
      stopRingtone();
      cleanupMedia();
    };
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

  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  };

  const resetCall = () => {
    stopRingtone();
    cleanupMedia();
    setCallStatus('idle');
    setIncomingCall(null);
    setCallInfo(null);
  };

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleIncoming = (data) => {
      console.log('[CallContext] Incoming call:', data);
      if (callStatusRef.current !== 'idle') {
        socket.emit('call:end', { targetId: data.callerId, reason: 'busy' });
        return;
      }
      setIncomingCall(data);
      setCallStatus('ringing');
      playRingtone();
    };

    const handleAnswered = async () => {
      console.log('[CallContext] Call answered by remote, creating peer...');
      stopRingtone();
      setCallStatus('connected');
      
      const targetId = callInfoRef.current?.targetId;
      if (!targetId) return;

      const peer = new Peer({
        initiator: true,
        stream: localStreamRef.current,
        config: ICE_SERVERS
      });
      peerRef.current = peer;

      peer.on('signal', data => {
        socket.emit('call:signal', { targetId, signal: data });
      });

      peer.on('stream', stream => {
        setRemoteStream(stream);
        setRemoteStreamTrigger(prev => prev + 1);
      });

      peer.on('error', err => {
        console.error('Peer error:', err);
        endCall('network_error');
      });

      peer.on('close', () => {
        resetCall();
      });
    };

    const handleSignal = ({ signal }) => {
      if (peerRef.current) {
        peerRef.current.signal(signal);
      }
    };

    const handleEnded = ({ reason }) => {
      console.log('[CallContext] Call ended by remote. Reason:', reason);
      if (callInfoRef.current?.isInitiator && callStatusRef.current === 'outgoing') {
        const targetId = callInfoRef.current.targetId;
        const status = reason === 'rejected' ? 'rejected' : 'missed';
        socket.emit('message:send', {
          receiverId: targetId,
          content: JSON.stringify({ type: callInfoRef.current.isVideo ? 'video' : 'audio', status, duration: '0:00' }),
          messageType: 'call-log',
        });
      }
      resetCall();
    };

    const handleError = (data) => {
      console.error('[CallContext] Call error:', data.message);
      alert(data.message || 'Call failed');
      resetCall();
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAnswered);
    socket.on('call:signal', handleSignal);
    socket.on('call:ended', handleEnded);
    socket.on('call:error', handleError);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAnswered);
      socket.off('call:signal', handleSignal);
      socket.off('call:ended', handleEnded);
      socket.off('call:error', handleError);
    };
  }, [socket, isConnected]);

  const startCall = async (targetId, isVideo = true) => {
    if (!socket || !targetId || callStatusRef.current !== 'idle') return;
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      } catch (mediaErr) {
        console.warn('Failed to get requested media, trying audio only...', mediaErr);
        if (isVideo) {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          isVideo = false;
          toast && toast.error("Could not access camera. Starting audio call instead.");
        } else {
          throw mediaErr;
        }
      }
      
      setLocalStream(stream);
      localStreamRef.current = stream; // Immediately set ref for socket callbacks
      setCallInfo({ targetId, isVideo, isInitiator: true });
      setCallStatus('outgoing');
      playRingtone();
      
      socket.emit('call:request', {
        receiverId: targetId,
        callerName: user?.name || 'Unknown',
        isVideo
      });
    } catch (err) {
      console.error('Failed to get local media:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const acceptCall = async () => {
    const incCall = incomingCallRef.current;
    if (!incCall || !socket) return;
    try {
      stopRingtone();
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: incCall.isVideo, audio: true });
      } catch (mediaErr) {
        console.warn('Failed to get requested media on answer, trying audio only...', mediaErr);
        if (incCall.isVideo) {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          incCall.isVideo = false;
          toast && toast.error("Could not access camera. Answering with audio only.");
        } else {
          throw mediaErr;
        }
      }
      
      setLocalStream(stream);
      localStreamRef.current = stream; 
      setCallInfo({ targetId: incCall.callerId, isVideo: incCall.isVideo, isInitiator: false });
      setCallStatus('connected');

      const peer = new Peer({
        initiator: false,
        stream: localStreamRef.current,
        config: ICE_SERVERS
      });
      peerRef.current = peer;

      peer.on('signal', data => {
        socket.emit('call:signal', { targetId: incCall.callerId, signal: data });
      });

      peer.on('stream', stream => {
        setRemoteStream(stream);
        setRemoteStreamTrigger(prev => prev + 1);
      });

      peer.on('error', err => {
        console.error('Peer error:', err);
        endCall('network_error');
      });

      peer.on('close', () => {
        resetCall();
      });
      
      socket.emit('call:answer', {
        callerId: incCall.callerId
      });
    } catch (err) {
      console.error('Failed to get local media on answer:', err);
      alert('Could not access microphone to answer the call. It may be in use by another tab or blocked by your browser.');
      rejectCall();
    }
  };

  const rejectCall = () => {
    const incCall = incomingCallRef.current;
    if (!incCall || !socket) return;
    socket.emit('call:end', { targetId: incCall.callerId, reason: 'rejected' });
    resetCall();
  };

  const endCall = (reason = 'ended') => {
    const targetId = callInfoRef.current?.targetId || incomingCallRef.current?.callerId;
    if (targetId && socket) {
      socket.emit('call:end', { targetId, reason });
      if (callInfoRef.current?.isInitiator && callStatusRef.current === 'outgoing') {
        socket.emit('message:send', {
          receiverId: targetId,
          content: JSON.stringify({ type: callInfoRef.current.isVideo ? 'video' : 'audio', status: 'missed', duration: '0:00' }),
          messageType: 'call-log',
        });
      }
    }
    resetCall();
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  const value = {
    callStatus,
    isCalling: callStatus !== 'idle',
    incomingCall,
    callInfo,
    localStream,
    remoteStream,
    remoteStreamTrigger,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

