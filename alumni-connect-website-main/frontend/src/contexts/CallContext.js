import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext();

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be inside CallProvider');
  return ctx;
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
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
  
  const pcRef = useRef(null);
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
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
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
      console.log('[CallContext] Call answered by remote, creating offer...');
      stopRingtone();
      setCallStatus('connected');
      
      const targetId = callInfoRef.current?.targetId;
      if (!targetId) return;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('call:ice-candidate', { targetId, candidate: { type: 'ice', candidate: e.candidate } });
        }
      };

      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0]);
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('call:ice-candidate', { targetId, candidate: { type: 'offer', sdp: offer } });
      } catch (err) {
        console.error('Error creating offer:', err);
      }
    };

    const handleSignal = async ({ candidate }) => {
      console.log('[CallContext] Signal received:', candidate.type);
      try {
        if (candidate.type === 'offer') {
          const targetId = incomingCallRef.current?.callerId || callInfoRef.current?.targetId;
          if (!targetId) return;

          let pc = pcRef.current;
          if (!pc) {
            pc = new RTCPeerConnection(ICE_SERVERS);
            pcRef.current = pc;
            
            if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
            }

            pc.onicecandidate = (e) => {
              if (e.candidate) {
                socket.emit('call:ice-candidate', { targetId, candidate: { type: 'ice', candidate: e.candidate } });
              }
            };

            pc.ontrack = (e) => {
              setRemoteStream(e.streams[0]);
            };
          }

          await pc.setRemoteDescription(new RTCSessionDescription(candidate.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('call:ice-candidate', { targetId, candidate: { type: 'answer', sdp: answer } });
        } 
        else if (candidate.type === 'answer') {
          if (pcRef.current) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(candidate.sdp));
          }
        } 
        else if (candidate.type === 'ice') {
          if (pcRef.current && candidate.candidate) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate.candidate));
          }
        }
      } catch (err) {
        console.error('Signal handling error:', err);
      }
    };

    const handleEnded = ({ reason }) => {
      console.log('[CallContext] Call ended by remote. Reason:', reason);
      resetCall();
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAnswered);
    socket.on('call:ice-candidate', handleSignal);
    socket.on('call:ended', handleEnded);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAnswered);
      socket.off('call:ice-candidate', handleSignal);
      socket.off('call:ended', handleEnded);
    };
  }, [socket, isConnected]);

  const startCall = async (targetId, isVideo = true) => {
    if (!socket || !targetId || callStatusRef.current !== 'idle') return;
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
    const incCall = incomingCallRef.current;
    if (!incCall || !socket) return;
    try {
      stopRingtone();
      const stream = await navigator.mediaDevices.getUserMedia({ video: incCall.isVideo, audio: true });
      setLocalStream(stream);
      setCallInfo({ targetId: incCall.callerId, isVideo: incCall.isVideo });
      setCallStatus('connected');
      
      socket.emit('call:answer', {
        callerId: incCall.callerId
      });
    } catch (err) {
      console.error('Failed to get local media on answer:', err);
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
      if (callStatusRef.current === 'outgoing') {
        socket.emit('message:send', {
          receiverId: targetId,
          content: JSON.stringify({ type: callInfoRef.current?.isVideo ? 'video' : 'audio', status: 'missed', duration: '0:00' }),
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
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
