import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext();

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be inside CallProvider');
  return ctx;
};

// STUN + TURN servers — metered.ca open relay (verified working, no API key needed)
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    // Open Relay TURN — works without sign-up
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:80?transport=tcp',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    // Backup TURN
    {
      urls: [
        'turn:relay.webwormhole.io:3478',
      ],
      username: 'webwormhole',
      credential: 'webwormhole',
    },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  // ── All state in plain refs so callbacks are NEVER stale ─────────────────
  const stateRef = useRef({
    status: 'idle',      // idle | ringing | outgoing | connecting | connected
    incomingCall: null,  // { callerId, callerName, isVideo, offer }
    localStream: null,
    remoteStream: null,
    callInfo: null,      // { isVideo, targetId }
    pc: null,
    targetId: null,
    iceQueue: [],
    remoteSet: false,
    callStartMs: null,
    isInitiator: false,
    isVideo: true,
    logSent: false,
  });

  // ── React state (for re-renders only) ───────────────────────────────────
  const [callStatus,    setCallStatus]    = useState('idle');
  const [incomingCall,  setIncomingCall]  = useState(null);
  const [localStream,   setLocalStream]   = useState(null);
  const [remoteStream,  setRemoteStream]  = useState(null);
  const [callInfo,      setCallInfo]      = useState(null);

  // ── Ringtone ─────────────────────────────────────────────────────────────
  const ringtoneRef = useRef(null);
  useEffect(() => {
    const audio = new Audio('/ringtone.mp3');
    audio.loop = true;
    ringtoneRef.current = audio;
    return () => { try { audio.pause(); } catch(_) {} };
  }, []);

  // Helper: sync state + ref together
  const setStatus = (s) => {
    stateRef.current.status = s;
    setCallStatus(s);

    const audio = ringtoneRef.current;
    if (!audio) return;
    if (s === 'ringing') {
      audio.play().catch(() =>
        toast('📞 Incoming call! Accept or Decline below.', { duration: 8000 })
      );
    } else {
      try { audio.pause(); audio.currentTime = 0; } catch(_) {}
    }
  };

  // ── Cleanup helpers ──────────────────────────────────────────────────────
  const stopStream = () => {
    const s = stateRef.current.localStream;
    if (s) { try { s.getTracks().forEach(t => t.stop()); } catch(_) {} }
    stateRef.current.localStream = null;
    setLocalStream(null);
  };

  const closePc = () => {
    const pc = stateRef.current.pc;
    if (pc) {
      try {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.onnegotiationneeded = null;
        pc.close();
      } catch(_) {}
      stateRef.current.pc = null;
    }
  };

  const fullReset = () => {
    closePc();
    stopStream();
    stateRef.current.remoteStream   = null;
    stateRef.current.incomingCall   = null;
    stateRef.current.callInfo       = null;
    stateRef.current.targetId       = null;
    stateRef.current.iceQueue       = [];
    stateRef.current.remoteSet      = false;
    stateRef.current.callStartMs    = null;
    stateRef.current.isInitiator    = false;
    stateRef.current.logSent        = false;
    setRemoteStream(null);
    setIncomingCall(null);
    setCallInfo(null);
    setStatus('idle');
  };

  // ── ICE queue drain ──────────────────────────────────────────────────────
  const drainIce = async () => {
    const { pc, remoteSet, iceQueue } = stateRef.current;
    if (!pc || !remoteSet) return;
    while (iceQueue.length > 0) {
      const c = iceQueue.shift();
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); }
      catch(e) { console.warn('[ICE drain]', e.message); }
    }
  };

  // ── Get user media with fallbacks ────────────────────────────────────────
  const getMedia = async (isVideo) => {
    // Try video+audio first
    if (isVideo) {
      try {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch(_) {}
    }
    // Try audio only
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      if (isVideo) toast('Camera unavailable — audio only.', { icon: '🎙️' });
      return stream;
    } catch(err) {
      toast.error('Mic/Camera access denied. Check browser permissions.');
      throw err;
    }
  };

  // ── Build peer connection ─────────────────────────────────────────────────
  const buildPc = () => {
    closePc();
    stateRef.current.remoteSet = false;

    const pc = new RTCPeerConnection(ICE_CONFIG);
    stateRef.current.pc = pc;

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && stateRef.current.targetId && socket) {
        console.log('[ICE] sending candidate');
        socket.emit('call:ice-candidate', {
          targetId: stateRef.current.targetId,
          candidate,
        });
      }
    };

    pc.ontrack = ({ streams }) => {
      const remote = streams[0] || null;
      console.log('[TRACK] remote stream received', remote?.getTracks().length, 'tracks');
      stateRef.current.remoteStream = remote;
      setRemoteStream(remote);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('[PC] connectionState =>', state);
      if (state === 'connected') {
        stateRef.current.callStartMs = Date.now();
        setStatus('connected');
        toast.success('🔗 Connected!', { duration: 3000, id: 'call-connected' });
      } else if (state === 'failed') {
        // Try ICE restart before giving up
        console.warn('[PC] Connection failed — attempting ICE restart');
        toast('Connection unstable, retrying…', { icon: '🔄', id: 'ice-retry', duration: 4000 });
        try {
          pc.restartIce();
        } catch(e) {
          console.error('[PC] ICE restart failed', e);
          // Only end call if we've been trying for a while (not immediate failure)
          const timeSinceStart = stateRef.current.callStartMs
            ? Date.now() - stateRef.current.callStartMs
            : 0;
          if (timeSinceStart > 10000) {
            // Call was connected before, now lost — end it
            endCall('ended');
          } else {
            toast.error('Could not connect. Check camera/mic permissions or try audio-only.');
            endCall('failed');
          }
        }
      } else if (state === 'disconnected') {
        toast('Connection interrupted. Waiting to reconnect…', { icon: '⚠️', id: 'reconnecting', duration: 10000 });
        // Give 10 s to recover — WebRTC often reconnects on its own
        setTimeout(() => {
          if (stateRef.current.pc === pc && pc.connectionState === 'disconnected') {
            endCall('ended');
          }
        }, 10000);
      } else if (state === 'closed') {
        // Do nothing — endCall already handled cleanup
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[ICE] iceConnectionState =>', pc.iceConnectionState);
    };

    pc.onicegatheringstatechange = () => {
      console.log('[ICE] gatheringState =>', pc.iceGatheringState);
    };

    return pc;
  };

  // ── endCall (called from UI and from socket events) ───────────────────────
  const endCall = (reason = 'ended') => {
    const { targetId, isInitiator, isVideo, callStartMs, status, logSent } = stateRef.current;
    console.log('[endCall] reason=', reason, 'status=', status, 'targetId=', targetId);

    // Notify remote peer
    if (targetId && socket) {
      socket.emit('call:end', { targetId, reason });
    }

    // Log call in chat history (initiator only, once)
    if (isInitiator && targetId && socket && !logSent) {
      stateRef.current.logSent = true;
      let dur = '0:00';
      if (callStartMs) {
        const s = Math.floor((Date.now() - callStartMs) / 1000);
        dur = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      }
      const logSt = (status === 'ringing' || status === 'outgoing' || status === 'connecting')
        ? (reason === 'rejected' ? 'rejected' : 'missed')
        : 'ended';

      socket.emit('message:send', {
        receiverId: targetId,
        content: JSON.stringify({ type: isVideo ? 'video' : 'audio', status: logSt, duration: dur }),
        messageType: 'call-log',
      });
    }

    fullReset();
  };

  // ── startCall (caller) ───────────────────────────────────────────────────
  const startCall = async (targetId, isVideo = true) => {
    if (!socket || !targetId) return;
    if (stateRef.current.status !== 'idle') {
      toast('Already in a call.', { icon: '⚠️' }); return;
    }

    console.log('[startCall] target=', targetId, 'isVideo=', isVideo);
    stateRef.current.targetId    = targetId;
    stateRef.current.isInitiator = true;
    stateRef.current.isVideo     = isVideo;
    stateRef.current.logSent     = false;

    const info = { isVideo, targetId };
    stateRef.current.callInfo = info;
    setCallInfo(info);
    setStatus('outgoing');

    try {
      const stream = await getMedia(isVideo);
      stateRef.current.localStream = stream;
      setLocalStream(stream);

      const pc = buildPc();
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      console.log('[startCall] emitting call:request');
      socket.emit('call:request', {
        receiverId: targetId,
        callerName: user?.name || 'Unknown',
        offer: pc.localDescription,  // Use localDescription (may include trickle ICE)
        isVideo,
      });
    } catch (err) {
      console.error('[startCall] error', err);
      fullReset();
    }
  };

  // ── acceptCall (receiver) ────────────────────────────────────────────────
  const acceptCall = async () => {
    const ic = stateRef.current.incomingCall;
    if (!ic || !socket) return;

    console.log('[acceptCall] callerId=', ic.callerId);
    stateRef.current.targetId    = ic.callerId;
    stateRef.current.isInitiator = false;
    stateRef.current.isVideo     = ic.isVideo;
    setStatus('connecting');

    try {
      const stream = await getMedia(ic.isVideo);
      stateRef.current.localStream = stream;
      setLocalStream(stream);

      const pc = buildPc();
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(ic.offer));
      stateRef.current.remoteSet = true;
      await drainIce();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('[acceptCall] emitting call:answer');
      socket.emit('call:answer', {
        callerId: ic.callerId,
        answer: pc.localDescription,
      });

      stateRef.current.incomingCall = null;
      setIncomingCall(null);
    } catch (err) {
      console.error('[acceptCall] error', err);
      endCall('ended');
    }
  };

  // ── rejectCall (receiver) ─────────────────────────────────────────────────
  const rejectCall = () => {
    const ic = stateRef.current.incomingCall;
    if (!ic || !socket) return;
    socket.emit('call:end', { targetId: ic.callerId, reason: 'rejected' });
    stateRef.current.incomingCall = null;
    setIncomingCall(null);
    setStatus('idle');
  };

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onIncoming = (data) => {
      console.log('[socket] call:incoming from', data.callerId);
      if (stateRef.current.status !== 'idle') {
        socket.emit('call:end', { targetId: data.callerId, reason: 'busy' });
        return;
      }
      stateRef.current.incomingCall = data;
      setIncomingCall(data);
      setStatus('ringing');
    };

    const onAccepted = async ({ answer }) => {
      console.log('[socket] call:accepted');
      const pc = stateRef.current.pc;
      if (!pc) { console.warn('No pc on accepted'); return; }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        stateRef.current.remoteSet = true;
        setStatus('connecting');
        await drainIce();
      } catch(e) { console.error('[onAccepted]', e); }
    };

    const onIceCandidate = async ({ candidate }) => {
      if (!candidate) return;
      const { pc, remoteSet, iceQueue } = stateRef.current;
      if (pc && remoteSet) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch(e) { console.warn('[ICE add]', e.message); }
      } else {
        console.log('[ICE] queued candidate');
        iceQueue.push(candidate);
      }
    };

    const onEnded = (data) => {
      console.log('[socket] call:ended reason=', data?.reason);
      endCall(data?.reason || 'ended');
    };

    const onError = (data) => {
      console.error('[socket] call:error', data);
      toast.error(data?.message || 'Call failed');
      endCall('ended');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

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

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
