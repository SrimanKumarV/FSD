import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from './SocketContext';

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within a CallProvider');
  return context;
};

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();

  // ── State ────────────────────────────────────────────────────────────
  const [callStatus, setCallStatus] = useState('idle');
  // idle | ringing | outgoing | connecting | connected
  const [incomingCall, setIncomingCall] = useState(null);  // { callerId, callerName, isVideo, offer }
  const [localStream, setLocalStream]   = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callInfo, setCallInfo]         = useState(null);  // { isVideo, targetId }

  // ── Refs (never stale in callbacks) ──────────────────────────────────
  const pcRef               = useRef(null);
  const localStreamRef      = useRef(null);
  const callStatusRef       = useRef('idle');
  const targetIdRef         = useRef(null);
  const iceQueueRef         = useRef([]);
  const remoteSetRef        = useRef(false);
  const ringtoneRef         = useRef(null);
  const callStartRef        = useRef(null);
  const isInitiatorRef      = useRef(false);
  const isVideoCallRef      = useRef(true);
  const logSentRef          = useRef(false);

  // Keep callStatusRef in sync
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);

  // ── Ringtone ──────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio('/ringtone.mp3');
    audio.loop = true;
    ringtoneRef.current = audio;
    return () => { audio.pause(); };
  }, []);

  useEffect(() => {
    const audio = ringtoneRef.current;
    if (!audio) return;
    if (callStatus === 'ringing') {
      audio.play().catch(() =>
        toast('📞 Incoming call! Accept or decline below.', { duration: 8000 })
      );
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [callStatus]);

  // ── Helpers ──────────────────────────────────────────────────────────
  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  const closePeer = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.onicecandidate   = null;
      pcRef.current.ontrack          = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
  }, []);

  const resetCallState = useCallback(() => {
    closePeer();
    stopLocalStream();
    setRemoteStream(null);
    setIncomingCall(null);
    setCallInfo(null);
    targetIdRef.current   = null;
    iceQueueRef.current   = [];
    remoteSetRef.current  = false;
    callStartRef.current  = null;
    isInitiatorRef.current = false;
    logSentRef.current    = false;
    setCallStatus('idle');
  }, [closePeer, stopLocalStream]);

  const drainIceQueue = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !remoteSetRef.current) return;
    while (iceQueueRef.current.length > 0) {
      const candidate = iceQueueRef.current.shift();
      try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch (e) { console.warn('ICE candidate error', e); }
    }
  }, []);

  const getMedia = useCallback(async (isVideo) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        toast('Camera unavailable — audio-only call.', { icon: '🎙️' });
        return stream;
      } catch (err) {
        toast.error('Microphone/Camera access denied. Please allow and retry.');
        throw err;
      }
    }
  }, []);

  // ── endCall ───────────────────────────────────────────────────────────
  // Must be defined BEFORE createPeer so the onconnectionstatechange handler can call it safely via ref
  const endCallRef = useRef(null);

  const endCall = useCallback((reason = 'ended') => {
    const targetId   = targetIdRef.current;
    const wasInitiator = isInitiatorRef.current;
    const wasVideo     = isVideoCallRef.current;
    const status       = callStatusRef.current;

    // Emit call:end to remote peer
    if (targetId && socket) {
      socket.emit('call:end', { targetId, reason });
    }

    // Emit call-log message (initiator only, once)
    if (wasInitiator && socket && targetId && !logSentRef.current) {
      logSentRef.current = true;
      let durationStr = '0:00';
      if (callStartRef.current) {
        const secs = Math.floor((Date.now() - callStartRef.current) / 1000);
        durationStr = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      }
      const logStatus = (status === 'ringing' || status === 'outgoing' || status === 'connecting')
        ? (reason === 'rejected' ? 'rejected' : 'missed')
        : 'ended';

      socket.emit('message:send', {
        receiverId: targetId,
        content: JSON.stringify({ type: wasVideo ? 'video' : 'audio', status: logStatus, duration: durationStr }),
        messageType: 'call-log',
      });
    }

    resetCallState();
  }, [socket, resetCallState]);

  // Keep ref up to date so createPeer can use it without stale closure
  endCallRef.current = endCall;

  // ── createPeer ────────────────────────────────────────────────────────
  const createPeer = useCallback(() => {
    closePeer();
    remoteSetRef.current = false;
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && targetIdRef.current && socket) {
        socket.emit('call:ice-candidate', { targetId: targetIdRef.current, candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0] || null);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        callStartRef.current = Date.now();
        setCallStatus('connected');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCallRef.current('ended');
      }
    };

    pcRef.current = pc;
    return pc;
  }, [socket, closePeer]);

  // ── startCall (caller side) ──────────────────────────────────────────
  const startCall = useCallback(async (targetId, isVideo = true) => {
    if (!socket || !targetId || callStatusRef.current !== 'idle') return;

    isInitiatorRef.current = true;
    isVideoCallRef.current = isVideo;
    targetIdRef.current    = targetId;
    logSentRef.current     = false;
    setCallInfo({ isVideo, targetId });
    setCallStatus('outgoing');

    try {
      const stream = await getMedia(isVideo);
      const pc = createPeer();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: isVideo });
      await pc.setLocalDescription(offer);

      socket.emit('call:request', { receiverId: targetId, offer, isVideo });
    } catch (err) {
      console.error('startCall error', err);
      resetCallState();
    }
  }, [socket, getMedia, createPeer, resetCallState]);

  // ── acceptCall (receiver side) ───────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !socket) return;
    const { callerId, offer, isVideo } = incomingCall;

    isInitiatorRef.current = false;
    isVideoCallRef.current = isVideo;
    targetIdRef.current    = callerId;
    setCallStatus('connecting');

    try {
      const stream = await getMedia(isVideo);
      const pc = createPeer();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      remoteSetRef.current = true;
      await drainIceQueue();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:answer', { callerId, answer });
      setIncomingCall(null);
    } catch (err) {
      console.error('acceptCall error', err);
      endCall('ended');
    }
  }, [incomingCall, socket, getMedia, createPeer, drainIceQueue, endCall]);

  // ── rejectCall (receiver side) ───────────────────────────────────────
  const rejectCall = useCallback(() => {
    if (!incomingCall || !socket) return;
    socket.emit('call:end', { targetId: incomingCall.callerId, reason: 'rejected' });
    setIncomingCall(null);
    setCallStatus('idle');
  }, [incomingCall, socket]);

  // ── Socket event listeners ───────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onIncoming = (data) => {
      if (callStatusRef.current !== 'idle') {
        socket.emit('call:end', { targetId: data.callerId, reason: 'busy' });
        return;
      }
      setIncomingCall(data);
      setCallStatus('ringing');
    };

    const onAccepted = async ({ answer }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        remoteSetRef.current = true;
        setCallStatus('connecting');
        await drainIceQueue();
      } catch (e) { console.error('onAccepted error', e); }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      if (pcRef.current && remoteSetRef.current) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (e) { console.warn('addIceCandidate error', e); }
      } else {
        iceQueueRef.current.push(candidate);
      }
    };

    const onEnded = (data) => {
      endCallRef.current(data?.reason || 'ended');
    };

    const onError = (data) => {
      toast.error(data?.message || 'Call failed');
      endCallRef.current('ended');
    };

    socket.on('call:incoming',      onIncoming);
    socket.on('call:accepted',      onAccepted);
    socket.on('call:ice-candidate', onIceCandidate);
    socket.on('call:ended',         onEnded);
    socket.on('call:error',         onError);

    return () => {
      socket.off('call:incoming',      onIncoming);
      socket.off('call:accepted',      onAccepted);
      socket.off('call:ice-candidate', onIceCandidate);
      socket.off('call:ended',         onEnded);
      socket.off('call:error',         onError);
    };
  }, [socket, drainIceQueue]);

  const value = {
    callStatus,
    incomingCall,
    localStream,
    remoteStream,
    callInfo,
    isCalling: callStatus !== 'idle',
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};
