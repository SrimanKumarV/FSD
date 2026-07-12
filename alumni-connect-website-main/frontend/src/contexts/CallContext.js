import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import Peer from 'simple-peer';

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
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, isVideo }
  const [callInfo, setCallInfo] = useState(null); // { targetId, isVideo }
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerRef = useRef(null);
  const ringtoneRef = useRef(null);

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
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStream(null);
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
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

    const handleAnswered = (data) => {
      console.log('[CallContext] Call answered by remote, signaling...');
      stopRingtone();
      setCallStatus('connected');
      
      // Initialize Peer (Initiator)
      const peer = new Peer({
        initiator: true,
        trickle: true,
        stream: localStream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:openrelay.metered.ca:443',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            }
          ]
        }
      });

      peer.on('signal', signal => {
        socket.emit('call:ice-candidate', { targetId: callInfo.targetId, candidate: signal });
      });

      peer.on('stream', stream => {
        console.log('[CallContext] Remote stream received (initiator)');
        setRemoteStream(stream);
      });

      peer.on('error', err => {
        console.error('Peer error (initiator):', err);
        endCall('error');
      });

      peerRef.current = peer;
    };

    const handleSignal = ({ candidate }) => {
      console.log('[CallContext] Signal received');
      if (peerRef.current) {
        peerRef.current.signal(candidate);
      }
    };

    const handleEnded = ({ reason }) => {
      console.log('[CallContext] Call ended by remote. Reason:', reason);
      resetCall();
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAnswered); // When receiver clicks accept
    socket.on('call:ice-candidate', handleSignal); // ICE/SDP exchange
    socket.on('call:ended', handleEnded);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAnswered);
      socket.off('call:ice-candidate', handleSignal);
      socket.off('call:ended', handleEnded);
    };
  }, [socket, isConnected, callStatus, callInfo, localStream]);

  const resetCall = () => {
    stopRingtone();
    cleanupMedia();
    setCallStatus('idle');
    setIncomingCall(null);
    setCallInfo(null);
  };

  const startCall = async (targetId, isVideo = true) => {
    if (!socket || !targetId || callStatus !== 'idle') return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      setLocalStream(stream);
      setCallInfo({ targetId, isVideo });
      setCallStatus('outgoing');
      
      socket.emit('call:request', {
        receiverId: targetId,
        callerName: user?.name || 'Unknown',
        isVideo
      });
    } catch (err) {
      console.error('Failed to get local media:', err);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || !socket) return;
    
    try {
      stopRingtone();
      const stream = await navigator.mediaDevices.getUserMedia({ video: incomingCall.isVideo, audio: true });
      setLocalStream(stream);
      setCallInfo({ targetId: incomingCall.callerId, isVideo: incomingCall.isVideo });
      setCallStatus('connected');
      
      // Initialize Peer (Receiver)
      const peer = new Peer({
        initiator: false,
        trickle: true,
        stream: stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:openrelay.metered.ca:443',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            }
          ]
        }
      });

      peer.on('signal', signal => {
        socket.emit('call:ice-candidate', { targetId: incomingCall.callerId, candidate: signal });
      });

      peer.on('stream', remoteStream => {
        console.log('[CallContext] Remote stream received (receiver)');
        setRemoteStream(remoteStream);
      });

      peer.on('error', err => {
        console.error('Peer error (receiver):', err);
        endCall('error');
      });

      peerRef.current = peer;

      // Tell the initiator we accepted so they can start signaling
      socket.emit('call:answer', {
        callerId: incomingCall.callerId
      });
      setIncomingCall(null);
    } catch (err) {
      console.error('Failed to get local media on answer:', err);
      rejectCall();
    }
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

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
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
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
