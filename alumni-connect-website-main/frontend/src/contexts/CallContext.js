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

  // ── PeerJS instance ────────────────────────────────────────────────
  const peerRef        = useRef(null);
  const activePeerCall = useRef(null); // PeerJS MediaConnection
  const pendingCall    = useRef(null); // incoming PeerJS call waiting for accept

  // ── Local media ────────────────────────────────────────────────────
  const localStreamRef = useRef(null);

  // ── React state (UI only) ─────────────────────────────────────────
  const [callStatus,   setCallStatus]   = useState('idle');
  // idle | ringing | outgoing | connecting | connected
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream,  setLocalStream]  = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callInfo,     setCallInfo]     = useState(null);

  // Keep a ref to callStatus so socket handlers are never stale
  const callStatusRef = useRef('idle');
  const setStatus = (s) => { callStatusRef.current = s; setCallStatus(s); };

  // ── Ringtone ───────────────────────────────────────────────────────
  const ringtoneRef = useRef(null);
  useEffect(() => {
    const a = new Audio('/ringtone.mp3');
    a.loop = true;
    ringtoneRef.current = a;
    return () => { try { a.pause(); } catch (_) {} };
  }, []);

  const playRingtone  = () => ringtoneRef.current?.play().catch(() =>
    toast('📞 Incoming call! Answer below.', { duration: 8000 })
  );
  const stopRingtone  = () => {
    try { const a = ringtoneRef.current; if (a) { a.pause(); a.currentTime = 0; } }
    catch (_) {}
  };

  // ── Call timer state ────────────────────────────────────────────────
  const [elapsed, setElapsed]   = useState(0);
  const timerRef  = useRef(null);
  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  };
  const stopTimer = () => {
    clearInterval(timerRef.current);
    setElapsed(0);
  };

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
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
  };

  // ── Attach a PeerJS MediaConnection after answer/call ──────────────
  const wireCall = (peerCall) => {
    activePeerCall.current = peerCall;

    peerCall.on('stream', (remote) => {
      console.log('[PeerJS] remote stream received');
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
    stopRingtone();
    stopTimer();
    if (activePeerCall.current) {
      try { activePeerCall.current.close(); } catch (_) {}
      activePeerCall.current = null;
    }
    pendingCall.current = null;
    setRemoteStream(null);
    setIncomingCall(null);
    setCallInfo(null);
    setStatus('idle');
  };

  // ── Initialize PeerJS when user logs in ────────────────────────────
  useEffect(() => {
    if (!user) return;
    const userId = (user._id || user.id).toString();

    // Destroy existing peer to prevent ID conflict on re-render
    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch (_) {}
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
          // PeerJS Cloud adds its own TURN servers on top of these
        ],
      },
    });

    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('[PeerJS] open, ID:', id);
    });

    // Incoming PeerJS call (fires when caller does peer.call())
    peer.on('call', (peerCall) => {
      console.log('[PeerJS] incoming peer call from:', peerCall.peer);
      // Store it — we'll answer when the user clicks Accept
      pendingCall.current = peerCall;
    });

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        console.warn('[PeerJS] ID taken, reconnecting with random ID');
        // Reconnect with a unique ID to avoid collision
        const altId = userId + '_' + Date.now();
        peerRef.current = new Peer(altId, { host: '0.peerjs.com', port: 443, path: '/', secure: true });
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
      peerRef.current = null;
    };
  }, [user]);

  // ── startCall (caller side) ─────────────────────────────────────────
  const startCall = async (targetUserId, isVideo = true) => {
    if (!socket || !targetUserId || callStatusRef.current !== 'idle') return;

    console.log('[startCall] target:', targetUserId, 'video:', isVideo);
    setCallInfo({ isVideo, targetId: targetUserId });
    setStatus('outgoing');

    try {
      const stream = await getMedia(isVideo);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Emit Socket.IO signal so receiver sees the ring UI
      socket.emit('call:request', {
        receiverId: targetUserId,
        callerName: user?.name || 'Unknown',
        callerPeerId: peerRef.current?.id || (user._id || user.id).toString(),
        isVideo,
      });
    } catch (err) {
      console.error('[startCall] media error', err);
      resetState();
    }
  };

  // ── acceptCall (receiver side) ──────────────────────────────────────
  const acceptCall = async () => {
    if (!incomingCall || !socket) return;
    const { callerId, callerPeerId, isVideo } = incomingCall;

    console.log('[acceptCall] caller:', callerId, 'peerId:', callerPeerId);
    stopRingtone();
    setStatus('connecting');

    try {
      const stream = await getMedia(isVideo);
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Tell the caller we accepted so they can do peer.call()
      socket.emit('call:answer', {
        callerId,
        answererId: (user._id || user.id).toString(),
        answererPeerId: peerRef.current?.id || (user._id || user.id).toString(),
      });

      setIncomingCall(null);

      // If PeerJS call already arrived (race condition handled), answer immediately
      if (pendingCall.current) {
        console.log('[acceptCall] answering pending PeerJS call');
        pendingCall.current.answer(stream);
        wireCall(pendingCall.current);
        pendingCall.current = null;
      }
      // Otherwise wireCall will be set up after peer.call() from caller
    } catch (err) {
      console.error('[acceptCall] error', err);
      endCall('ended');
    }
  };

  // ── rejectCall (receiver) ───────────────────────────────────────────
  const rejectCall = () => {
    if (!incomingCall || !socket) return;
    socket.emit('call:end', { targetId: incomingCall.callerId, reason: 'rejected' });
    stopRingtone();
    pendingCall.current = null;
    setIncomingCall(null);
    setStatus('idle');
  };

  // ── endCall ──────────────────────────────────────────────────────────
  const endCall = (reason = 'ended', notifyRemote = true) => {
    console.log('[endCall] reason:', reason);

    const targetId = callInfo?.targetId || incomingCall?.callerId;
    if (notifyRemote && targetId && socket) {
      socket.emit('call:end', { targetId, reason });
    }

    // Log call-log message in chat (if we started the call)
    if (callInfo?.targetId && socket) {
      const dur = elapsed > 0
        ? `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
        : '0:00';
      const logStatus = (callStatus === 'outgoing' || callStatus === 'connecting')
        ? (reason === 'rejected' ? 'rejected' : 'missed')
        : 'ended';
      socket.emit('message:send', {
        receiverId: callInfo.targetId,
        content: JSON.stringify({ type: callInfo.isVideo ? 'video' : 'audio', status: logStatus, duration: dur }),
        messageType: 'call-log',
      });
    }

    resetState();
  };

  // ── Socket.IO event listeners ────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onIncoming = (data) => {
      console.log('[socket] call:incoming', data);
      if (callStatusRef.current !== 'idle') {
        socket.emit('call:end', { targetId: data.callerId, reason: 'busy' });
        return;
      }
      setIncomingCall(data);
      setStatus('ringing');
      playRingtone();
    };

    // Caller receives this when receiver accepted → now initiate PeerJS call
    const onAccepted = ({ answererPeerId }) => {
      console.log('[socket] call:accepted, answererId:', answererPeerId);
      const stream = localStreamRef.current;
      const peer = peerRef.current;
      if (!stream || !peer || !answererPeerId) return;

      setStatus('connecting');

      console.log('[PeerJS] calling peer:', answererPeerId);
      const peerCall = peer.call(answererPeerId, stream);
      wireCall(peerCall);

      // If receiver already answered the PeerJS call before we called (unlikely but safe)
    };

    const onEnded = ({ reason } = {}) => {
      console.log('[socket] call:ended reason:', reason);
      stopRingtone();
      pendingCall.current = null;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, callInfo, callStatus, elapsed]);

  const value = {
    callStatus, incomingCall, localStream, remoteStream,
    callInfo, elapsed, isCalling: callStatus !== 'idle',
    startCall, acceptCall, rejectCall, endCall,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
