import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from './SocketContext';
import VideoCallOverlay from '../components/chat/VideoCallOverlay';
import { useLocation } from 'react-router-dom';

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');

  const peerConnection = useRef(null);
  const activeCallTargetId = useRef(null);
  const iceCandidateQueue = useRef([]);
  const isRemoteDescriptionSet = useRef(false);
  const callStatusRef = useRef('idle');
  const ringtoneRef = useRef(null);
  const location = useLocation();
  const isChatRoute = location.pathname.includes('/chat');
  
  // Call History Logging Refs
  const callStartTimeRef = useRef(null);
  const isInitiatorRef = useRef(false);
  const isVideoCallRef = useRef(true);

  // Initialize ringtone audio
  useEffect(() => {
    ringtoneRef.current = new Audio('/ringtone.mp3'); // We will use a standard sound or create one
    ringtoneRef.current.loop = true;
  }, []);

  // Handle playing/stopping ringtone based on status
  useEffect(() => {
    callStatusRef.current = callStatus;
    
    if (callStatus === 'ringing') {
      // Play ringtone if there's an incoming call
      if (ringtoneRef.current) {
        // Try to play, but catch autoplay block and fallback to toast/banner
        const playPromise = ringtoneRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            console.log('Audio autoplay blocked by browser', e);
            toast('Incoming call! Click here to answer and enable audio.', {
              icon: '📞',
              duration: 10000,
            });
          });
        }
      }
    } else {
      // Stop ringtone for any other status
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    }
  }, [callStatus]);

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  };

  const getMedia = useCallback(async (isVideo = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('Failed to get video+audio, falling back to audio only if possible...', err);
      if (isVideo) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          toast.success('Camera not found. Falling back to audio only.');
          setLocalStream(audioStream);
          return audioStream;
        } catch (audioErr) {
          console.error('Audio fallback also failed', audioErr);
        }
      }
      
      console.error('Failed to get media devices completely', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Camera/Microphone access was denied. Please grant permissions.');
      } else if (err.name === 'NotFoundError') {
        toast.error('No camera/microphone found on this device.');
      } else {
        toast.error('Failed to access media devices. Check permissions or use HTTPS.');
      }
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(iceServers);
    isRemoteDescriptionSet.current = false;
    
    pc.onicecandidate = (event) => {
      if (event.candidate && activeCallTargetId.current) {
        socket?.emit('call:ice-candidate', {
          targetId: activeCallTargetId.current,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
        callStartTimeRef.current = Date.now();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [socket]);

  const processIceQueue = async () => {
    if (peerConnection.current && isRemoteDescriptionSet.current) {
      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift();
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error processing queued ICE candidate', e);
        }
      }
    }
  };

  const startCall = async (targetId, isVideo = true) => {
    if (!targetId || !socket) return;
    try {
      activeCallTargetId.current = targetId;
      setCallStatus('connecting');
      setIsCalling(true);
      isInitiatorRef.current = true;
      isVideoCallRef.current = isVideo;
      
      const stream = await getMedia(isVideo);
      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:request', {
        receiverId: targetId,
        offer,
        isVideo
      });
    } catch (error) {
      console.error('Failed to start call', error);
      setCallStatus('idle');
      setIsCalling(false);
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || !socket) return;
    try {
      activeCallTargetId.current = incomingCall.callerId;
      setCallStatus('connecting');
      isInitiatorRef.current = false;
      isVideoCallRef.current = incomingCall.isVideo;
      
      const stream = await getMedia(incomingCall.isVideo);
      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      isRemoteDescriptionSet.current = true;
      processIceQueue();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:answer', {
        callerId: incomingCall.callerId,
        answer
      });
      
      setIsCalling(true);
      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to accept call', error);
      endCall();
    }
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit('call:end', { targetId: incomingCall.callerId, reason: 'rejected' });
      setIncomingCall(null);
      setCallStatus('idle');
    }
  };

  const endCall = useCallback((reason = 'ended') => {
    if (activeCallTargetId.current && socket) {
      // Determine call duration
      let durationStr = "0:00";
      if (callStartTimeRef.current) {
        const diffMs = Date.now() - callStartTimeRef.current;
        const totalSeconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }

      // Determine log status based on states before reset
      let logStatus = "ended";
      if (callStatusRef.current === 'ringing' || callStatusRef.current === 'connecting') {
        logStatus = reason === 'rejected' ? 'rejected' : 'missed';
      }

      // If I am the initiator, log this call to chat history exactly once
      if (isInitiatorRef.current) {
        isInitiatorRef.current = false; // Prevent multiple logs on double-clicks
        const typeStr = isVideoCallRef.current ? "video" : "audio";
        const logContent = JSON.stringify({ type: typeStr, status: logStatus, duration: durationStr });
        
        socket.emit('message:send', {
          receiverId: activeCallTargetId.current,
          content: logContent,
          messageType: 'call-log'
        });
      }

      socket.emit('call:end', { targetId: activeCallTargetId.current, reason });
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    setLocalStream(prev => {
      if (prev) {
        prev.getTracks().forEach(track => track.stop());
      }
      return null;
    });

    activeCallTargetId.current = null;
    iceCandidateQueue.current = [];
    isRemoteDescriptionSet.current = false;
    callStartTimeRef.current = null;
    isInitiatorRef.current = false;
    setRemoteStream(null);
    setIsCalling(false);
    setIncomingCall(null);
    setCallStatus('idle');
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data) => {
      if (callStatusRef.current === 'idle') {
        setIncomingCall(data);
        setCallStatus('ringing');
      } else {
        socket.emit('call:end', { targetId: data.callerId });
      }
    };

    const handleAccepted = async (data) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        isRemoteDescriptionSet.current = true;
        processIceQueue();
      }
    };

    const handleIceCandidate = async (data) => {
      if (peerConnection.current && isRemoteDescriptionSet.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      } else {
        iceCandidateQueue.current.push(data.candidate);
      }
    };

    const handleEnded = (data) => {
      endCall(data?.reason || 'ended');
    };

    const handleError = (data) => {
      toast.error(data.message || 'Call error');
      endCall();
    };

    socket.on('call:incoming', handleIncoming);
    socket.on('call:accepted', handleAccepted);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:ended', handleEnded);
    socket.on('call:error', handleError);

    return () => {
      socket.off('call:incoming', handleIncoming);
      socket.off('call:accepted', handleAccepted);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:ended', handleEnded);
      socket.off('call:error', handleError);
    };
  }, [socket, endCall]);

  const value = {
    localStream,
    remoteStream,
    isCalling,
    incomingCall,
    callStatus,
    startCall,
    acceptCall,
    rejectCall,
    endCall
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      {(!isChatRoute || callStatus === 'ringing') && (
        <VideoCallOverlay
          localStream={localStream}
          remoteStream={remoteStream}
          callStatus={callStatus}
          incomingCall={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEndCall={endCall}
        />
      )}
    </CallContext.Provider>
  );
};
