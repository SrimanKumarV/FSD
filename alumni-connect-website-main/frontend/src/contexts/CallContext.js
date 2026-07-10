import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import Peer from 'peerjs';
import toast from 'react-hot-toast';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const CallContext = createContext();

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be inside CallProvider');
  return ctx;
};

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user }   = useAuth();

  // ── All state in plain refs so callbacks are NEVER stale ─────────────────
  const stateRef = useRef({
    status: 'idle',      // idle | ringing | outgoing | connecting | connected
    incomingCall: null,  // { callerId, callerName, isVideo, callerPeerId }
    localStream: null,
    remoteStream: null,
    callInfo: null,      // { isVideo, targetId }
    activePeerCall: null,
    pendingCall: null,
    peer: null,
  });

  // ── React state (for re-renders only) ───────────────────────────────────
  const [callStatus,   setCallStatus]   = useState('idle');
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream,  setLocalStream]  = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callInfo,     setCallInfo]     = useState(null);

  // ── Ringtone ─────────────────────────────────────────────────────────────
  const ringtoneRef = useRef(null);
  useEffect(() => {
    const a = new Audio('/ringtone.mp3');
    a.loop = true;
    ringtoneRef.current = a;
    return () => { try { a.pause(); } catch (_) {} };
  }, []);

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

  // ── Call timer state ────────────────────────────────────────────────
  const [elapsed, setElapsed]   = useState(0);
  const timerRef  = useRef(null);
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsed(0);
  };
  
  // Ref for timer so endCall can read latest value
  const elapsedRef = useRef(0);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);

  // ── Helper: get user media with audio-only fallback ─────────────────
  const getMedia = async (isVideo) => {
    if (isVideo) {
      try { return await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); }
      catch (_) {}
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      if (isVideo) toast('Camera unavailable — audio only.', { icon: '🎙️' });
      return s;
    } catch (e) {
      toast.error('Camera/Microphone access denied. Please allow and retry.');
      throw e;
    }
  };

  // ── Stop local stream ───────────────────────────────────────────────
  const stopLocalStream = () => {
    const s = stateRef.current.localStream;
    if (s) { try { s.getTracks().forEach(t => t.stop()); } catch(_) {} }
    stateRef.current.localStream = null;
    setLocalStream(null);
  };

  // ── endCall (must be defined early to be used in wireCall) ──────────
  const endCall = (reason = 'ended', notifyRemote = true) => {
    console.log('[endCall] reason:', reason);
    const { targetId } = stateRef.current.callInfo || {};
    const { callerId } = stateRef.current.incomingCall || {};
    const remoteId = targetId || callerId;

    if (notifyRemote && remoteId && socket) {
      socket.emit('call:end', { targetId: remoteId, reason });
    }

    // Log call-log message in chat (if we started the call)
    if (targetId && socket) {
      const currentElapsed = elapsedRef.current;
      const dur = currentElapsed > 0
        ? `${Math.floor(currentElapsed / 60)}:${String(currentElapsed % 60).padStart(2, '0')}`
        : '0:00';
      const status = stateRef.current.status;
      const logStatus = (status === 'outgoing' || status === 'connecting')
        ? (reason === 'rejected' ? 'rejected' : 'missed')
        : 'ended';
      
      const isVideo = stateRef.current.callInfo?.isVideo;
      socket.emit('message:send', {
        receiverId: targetId,
        content: JSON.stringify({ type: isVideo ? 'video' : 'audio', status: logStatus, duration: dur }),
        messageType: 'call-log',
      });
    }

    resetState();
  };

  // ── Attach a PeerJS MediaConnection after answer/call ──────────────
  const wireCall = (peerCall) => {
    stateRef.current.activePeerCall = peerCall;

    peerCall.on('stream', (remote) => {
      console.log('[PeerJS] remote stream received');
      stateRef.current.remoteStream = remote;
      setRemoteStream(remote);
      setStatus('connected');
      startTimer();
      toast.success('🔗 Connected!', { id: 'call-connected', duration: 3000 });
    });

    peerCall.on('close', () => {
      console.log('[PeerJS] call closed');
      endCall('ended', false); // false = don't notify remote (already closed)
    });

    peerCall.on('error', (err) => {
      console.error('[PeerJS] call error', err);
      toast.error('Call error. Please try again.');
      endCall('failed', false);
    });
  };

  // ── Full reset ──────────────────────────────────────────────────────
  const resetState = () => {
    stopLocalStream();
    stopTimer();
    const { activePeerCall } = stateRef.current;
    if (activePeerCall) {
      try { activePeerCall.close(); } catch (_) {}
      stateRef.current.activePeerCall = null;
    }
    stateRef.current.pendingCall = null;
    stateRef.current.remoteStream = null;
    stateRef.current.incomingCall = null;
    stateRef.current.callInfo = null;
    
    setRemoteStream(null);
    setIncomingCall(null);
    setCallInfo(null);
    setStatus('idle');
  };

  // ── Initialize PeerJS when user logs in ────────────────────────────
  useEffect(() => {
    if (!user) return;
    const userId = (user._id || user.id).toString();

    if (stateRef.current.peer) {
      try { stateRef.current.peer.destroy(); } catch (_) {}
    }

    const peer = new Peer(userId, {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    stateRef.current.peer = peer;

    peer.on('open', (id) => {
      console.log('[PeerJS] open, ID:', id);
    });

    peer.on('call', (peerCall) => {
      console.log('[PeerJS] incoming peer call from:', peerCall.peer);
      
      const { status, localStream } = stateRef.current;
      if (status === 'connecting' && localStream) {
        // We already accepted the call via socket, now the actual peer call arrived
        console.log('[PeerJS] answering incoming call immediately');
        peerCall.answer(localStream);
        wireCall(peerCall);
      } else {
        // Store it — we'll answer when the user clicks Accept
        stateRef.current.pendingCall = peerCall;
      }
    });

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        console.warn('[PeerJS] ID taken, reconnecting with random ID');
        const altId = userId + '_' + Date.now();
        stateRef.current.peer = new Peer(altId, { host: '0.peerjs.com', port: 443, path: '/', secure: true });
      } else {
        console.error('[PeerJS] error:', err.type, err.message);
      }
    });

    peer.on('disconnected', () => {
      console.warn('[PeerJS] disconnected, reconnecting...');
      try { peer.reconnect(); } catch (_) {}
    });

    return () => {
      try { peer.destroy(); } catch (_) {}
      stateRef.current.peer = null;
    };
  }, [user]);

  // ── startCall (caller side) ─────────────────────────────────────────
  const startCall = async (targetUserId, isVideo = true) => {
    if (!socket || !targetUserId || stateRef.current.status !== 'idle') return;

    console.log('[startCall] target:', targetUserId, 'video:', isVideo);
    
    const info = { isVideo, targetId: targetUserId };
    stateRef.current.callInfo = info;
    setCallInfo(info);
    setStatus('outgoing');

    try {
      const stream = await getMedia(isVideo);
      stateRef.current.localStream = stream;
      setLocalStream(stream);

      socket.emit('call:request', {
        receiverId: targetUserId,
        callerName: user?.name || 'Unknown',
        callerPeerId: stateRef.current.peer?.id || (user._id || user.id).toString(),
        isVideo,
      });
    } catch (err) {
      console.error('[startCall] media error', err);
      resetState();
    }
  };

  // ── acceptCall (receiver side) ──────────────────────────────────────
  const acceptCall = async () => {
    const ic = stateRef.current.incomingCall;
    if (!ic || !socket) return;
    
    const { callerId, callerPeerId, isVideo } = ic;
    console.log('[acceptCall] caller:', callerId, 'peerId:', callerPeerId);
    
    setStatus('connecting');

    try {
      const stream = await getMedia(isVideo);
      stateRef.current.localStream = stream;
      setLocalStream(stream);

      socket.emit('call:answer', {
        callerId,
        answererId: (user._id || user.id).toString(),
        answererPeerId: stateRef.current.peer?.id || (user._id || user.id).toString(),
      });

      stateRef.current.incomingCall = null;
      setIncomingCall(null);

      // If PeerJS call already arrived (race condition handled), answer immediately
      const pc = stateRef.current.pendingCall;
      if (pc) {
        console.log('[acceptCall] answering pending PeerJS call');
        pc.answer(stream);
        wireCall(pc);
        stateRef.current.pendingCall = null;
      }
    } catch (err) {
      console.error('[acceptCall] error', err);
      endCall('ended');
    }
  };

  // ── rejectCall (receiver) ───────────────────────────────────────────
  const rejectCall = () => {
    const ic = stateRef.current.incomingCall;
    if (!ic || !socket) return;
    socket.emit('call:end', { targetId: ic.callerId, reason: 'rejected' });
    
    stateRef.current.pendingCall = null;
    stateRef.current.incomingCall = null;
    setIncomingCall(null);
    setStatus('idle');
  };

  // ── Socket.IO event listeners ────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onIncoming = (data) => {
      console.log('[socket] call:incoming', data);
      if (stateRef.current.status !== 'idle') {
        socket.emit('call:end', { targetId: data.callerId, reason: 'busy' });
        return;
      }
      stateRef.current.incomingCall = data;
      setIncomingCall(data);
      setStatus('ringing');
    };

    const onAccepted = ({ answererPeerId }) => {
      console.log('[socket] call:accepted, answererId:', answererPeerId);
      const stream = stateRef.current.localStream;
      const peer = stateRef.current.peer;
      
      if (!stream || !peer || !answererPeerId) return;

      setStatus('connecting');

      console.log('[PeerJS] calling peer:', answererPeerId);
      const peerCall = peer.call(answererPeerId, stream);
      wireCall(peerCall);
    };

    const onEnded = ({ reason } = {}) => {
      console.log('[socket] call:ended reason:', reason);
      stateRef.current.pendingCall = null;
      resetState();
    };

    const onError = (data) => {
      toast.error(data?.message || 'Call failed');
      resetState();
    };

    socket.on('call:incoming',  onIncoming);
    socket.on('call:accepted',  onAccepted);
    socket.on('call:ended',     onEnded);
    socket.on('call:error',     onError);

    return () => {
      socket.off('call:incoming',  onIncoming);
      socket.off('call:accepted',  onAccepted);
      socket.off('call:ended',     onEnded);
      socket.off('call:error',     onError);
    };
    // ONLY depend on socket, so listeners are NEVER detached/re-attached!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const value = {
    callStatus, incomingCall, localStream, remoteStream,
    callInfo, elapsed, isCalling: callStatus !== 'idle',
    startCall, acceptCall, rejectCall, endCall,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
