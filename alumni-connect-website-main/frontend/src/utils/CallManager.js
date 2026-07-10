class CallManager {
  constructor() {
    if (CallManager.instance) {
      return CallManager.instance;
    }
    
    CallManager.instance = this;
    
    // Core dependencies
    this.socket = null;
    this.user = null;
    
    // State
    this.status = 'idle'; // idle | ringing | outgoing | connecting | connected
    this.incomingCall = null; // { callerId, callerName, isVideo, offer }
    this.callInfo = null; // { isVideo, targetId }
    this.elapsed = 0;
    
    // WebRTC references
    this.pc = null;
    this.localStream = null;
    this.remoteStream = null;
    this.iceQueue = [];
    this.remoteSet = false;
    this.callStartMs = null;
    this.isInitiator = false;
    this.timerId = null;
    
    // Listeners for UI
    this.listeners = new Set();
    
    this.ICE_CONFIG = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
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
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };
    
    // Bind methods
    this.onIncoming = this.onIncoming.bind(this);
    this.onAccepted = this.onAccepted.bind(this);
    this.onIceCandidate = this.onIceCandidate.bind(this);
    this.onEnded = this.onEnded.bind(this);
    this.onError = this.onError.bind(this);
  }

  // --- INITIALIZATION ---
  
  init(socket, user) {
    if (!socket || !user) return;
    
    // If socket changed, re-attach listeners
    if (this.socket !== socket) {
      if (this.socket) {
        this.socket.off('call:incoming', this.onIncoming);
        this.socket.off('call:accepted', this.onAccepted);
        this.socket.off('call:ice-candidate', this.onIceCandidate);
        this.socket.off('call:ended', this.onEnded);
        this.socket.off('call:error', this.onError);
      }
      
      this.socket = socket;
      this.user = user;
      
      this.socket.on('call:incoming', this.onIncoming);
      this.socket.on('call:accepted', this.onAccepted);
      this.socket.on('call:ice-candidate', this.onIceCandidate);
      this.socket.on('call:ended', this.onEnded);
      this.socket.on('call:error', this.onError);
    }
  }

  // --- EVENT EMITTER ---
  
  on(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emit() {
    const state = {
      status: this.status,
      incomingCall: this.incomingCall,
      localStream: this.localStream,
      remoteStream: this.remoteStream,
      callInfo: this.callInfo,
      elapsed: this.elapsed,
      isCalling: this.status !== 'idle',
    };
    this.listeners.forEach(cb => cb(state));
  }
  
  setStatus(newStatus) {
    this.status = newStatus;
    
    // Play/Pause ringtone based on status
    if (newStatus === 'ringing') {
      this.playRingtone();
    } else {
      this.stopRingtone();
    }
    
    this.emit();
  }

  // --- TIMER ---
  
  startTimer() {
    if (this.timerId) clearInterval(this.timerId);
    this.elapsed = 0;
    this.callStartMs = Date.now();
    this.timerId = setInterval(() => {
      this.elapsed += 1;
      this.emit();
    }, 1000);
  }
  
  stopTimer() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
    this.elapsed = 0;
  }

  // --- AUDIO RINGTONE ---
  
  playRingtone() {
    if (!this.ringtone) {
      this.ringtone = new Audio('/ringtone.mp3');
      this.ringtone.loop = true;
    }
    this.ringtone.play().catch(e => console.warn('Autoplay prevented ringtone:', e));
  }
  
  stopRingtone() {
    if (this.ringtone) {
      this.ringtone.pause();
      this.ringtone.currentTime = 0;
    }
  }

  // --- DOM STREAM ATTACHMENT ---
  
  attachMedia() {
    // Aggressively find the DOM elements and attach streams
    // This bypasses React's ref lifecycle to guarantee playback
    const localVideo = document.getElementById('local-video');
    const remoteVideo = document.getElementById('remote-video');
    
    if (localVideo && this.localStream && localVideo.srcObject !== this.localStream) {
      console.log('[CallManager] Attaching LOCAL stream');
      localVideo.srcObject = this.localStream;
      localVideo.onloadedmetadata = () => {
        localVideo.play().catch(e => console.warn('[CallManager] Local play error:', e));
      };
    }
    
    if (remoteVideo && this.remoteStream && remoteVideo.srcObject !== this.remoteStream) {
      console.log(`[CallManager] Attaching REMOTE stream. Audio: ${this.remoteStream.getAudioTracks().length}`);
      remoteVideo.srcObject = this.remoteStream;
      remoteVideo.onloadedmetadata = () => {
        remoteVideo.play().catch(e => console.warn('[CallManager] Remote play error:', e));
      };
    }
  }

  // --- WEBRTC LIFECYCLE ---
  
  async getMedia(isVideo) {
    try {
      if (isVideo) {
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }
      return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
    } catch (e) {
      console.error('[CallManager] getMedia failed', e);
      if (isVideo) {
        // Fallback to audio only
        return await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      }
      throw e;
    }
  }

  closePc() {
    if (this.pc) {
      this.pc.onicecandidate = null;
      this.pc.ontrack = null;
      this.pc.onconnectionstatechange = null;
      this.pc.oniceconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }
  }
  
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }
  }

  buildPc() {
    this.closePc();
    this.remoteSet = false;
    
    const pc = new RTCPeerConnection(this.ICE_CONFIG);
    this.pc = pc;
    
    pc.onicecandidate = ({ candidate }) => {
      const targetId = this.callInfo?.targetId || this.incomingCall?.callerId;
      if (candidate && targetId && this.socket) {
        this.socket.emit('call:ice-candidate', { targetId, candidate });
      }
    };
    
    pc.ontrack = ({ streams }) => {
      const remote = streams[0] || null;
      console.log(`[CallManager] REMOTE TRACK RECEIVED. Tracks:`, remote?.getTracks().length);
      this.remoteStream = remote;
      this.emit();
      
      // Delay attachment slightly to ensure DOM has updated to 'connected' state
      setTimeout(() => this.attachMedia(), 100);
      setTimeout(() => this.attachMedia(), 500); // safety net
    };
    
    pc.onconnectionstatechange = () => {
      console.log('[CallManager] PC State:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        this.setStatus('connected');
        this.startTimer();
      } else if (pc.connectionState === 'failed') {
        console.warn('[CallManager] ICE Failed, attempting restart...');
        try { pc.restartIce(); } catch (_) {}
      } else if (pc.connectionState === 'disconnected') {
        setTimeout(() => {
          if (this.pc === pc && pc.connectionState === 'disconnected') {
            this.endCall('ended');
          }
        }, 10000);
      }
    };
    
    return pc;
  }
  
  async drainIce() {
    if (!this.pc || !this.remoteSet) return;
    while (this.iceQueue.length > 0) {
      const candidate = this.iceQueue.shift();
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[CallManager] ICE add error:', e);
      }
    }
  }

  // --- API CALLS ---
  
  async startCall(targetId, isVideo = true) {
    if (!this.socket || !targetId || this.status !== 'idle') return;
    
    console.log('[CallManager] Starting call to', targetId);
    this.isInitiator = true;
    this.callInfo = { targetId, isVideo };
    this.setStatus('outgoing');
    
    try {
      this.localStream = await this.getMedia(isVideo);
      this.emit();
      this.attachMedia();
      
      const pc = this.buildPc();
      this.localStream.getTracks().forEach(t => pc.addTrack(t, this.localStream));
      
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      
      this.socket.emit('call:request', {
        receiverId: targetId,
        callerName: this.user?.name || 'Unknown',
        offer: pc.localDescription,
        isVideo
      });
      
    } catch (err) {
      console.error('[CallManager] startCall error:', err);
      this.reset();
    }
  }
  
  async acceptCall() {
    if (!this.incomingCall || !this.socket) return;
    
    const { callerId, isVideo, offer } = this.incomingCall;
    this.isInitiator = false;
    this.callInfo = { targetId: callerId, isVideo }; // Store for endCall
    this.setStatus('connecting');
    
    try {
      this.localStream = await this.getMedia(isVideo);
      this.emit();
      this.attachMedia();
      
      const pc = this.buildPc();
      this.localStream.getTracks().forEach(t => pc.addTrack(t, this.localStream));
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      this.remoteSet = true;
      await this.drainIce();
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      this.socket.emit('call:answer', {
        callerId: callerId,
        answer: pc.localDescription
      });
      
      this.incomingCall = null;
      this.emit();
    } catch (err) {
      console.error('[CallManager] acceptCall error:', err);
      this.endCall('ended');
    }
  }
  
  rejectCall() {
    if (!this.incomingCall || !this.socket) return;
    this.socket.emit('call:end', { targetId: this.incomingCall.callerId, reason: 'rejected' });
    this.reset();
  }
  
  endCall(reason = 'ended', notifyRemote = true) {
    console.log('[CallManager] endCall, reason:', reason);
    
    const targetId = this.callInfo?.targetId || this.incomingCall?.callerId;
    
    if (notifyRemote && targetId && this.socket) {
      this.socket.emit('call:end', { targetId, reason });
    }
    
    // Log call if initiator
    if (this.isInitiator && targetId && this.socket) {
      const dur = this.elapsed > 0
        ? `${Math.floor(this.elapsed / 60)}:${String(this.elapsed % 60).padStart(2, '0')}`
        : '0:00';
        
      const logStatus = (this.status === 'outgoing' || this.status === 'connecting')
        ? (reason === 'rejected' ? 'rejected' : 'missed')
        : 'ended';
        
      this.socket.emit('message:send', {
        receiverId: targetId,
        content: JSON.stringify({ type: this.callInfo?.isVideo ? 'video' : 'audio', status: logStatus, duration: dur }),
        messageType: 'call-log',
      });
    }
    
    this.reset();
  }
  
  reset() {
    this.stopLocalStream();
    this.closePc();
    this.stopTimer();
    this.stopRingtone();
    
    this.status = 'idle';
    this.incomingCall = null;
    this.callInfo = null;
    this.remoteStream = null;
    this.iceQueue = [];
    this.remoteSet = false;
    this.callStartMs = null;
    this.isInitiator = false;
    
    this.emit();
  }

  // --- SOCKET HANDLERS ---
  
  onIncoming(data) {
    console.log('[CallManager] Incoming call from:', data.callerId);
    if (this.status !== 'idle') {
      this.socket.emit('call:end', { targetId: data.callerId, reason: 'busy' });
      return;
    }
    this.incomingCall = data;
    this.setStatus('ringing');
  }
  
  async onAccepted({ answer }) {
    console.log('[CallManager] Call accepted');
    if (!this.pc) return;
    this.setStatus('connecting');
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
      this.remoteSet = true;
      await this.drainIce();
    } catch (e) {
      console.error('[CallManager] Error setting remote description:', e);
    }
  }
  
  async onIceCandidate({ candidate }) {
    if (!candidate) return;
    if (this.pc && this.remoteSet) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[CallManager] ICE add error:', e);
      }
    } else {
      this.iceQueue.push(candidate);
    }
  }
  
  onEnded({ reason }) {
    console.log('[CallManager] Call ended by remote. Reason:', reason);
    this.reset();
  }
  
  onError(data) {
    console.error('[CallManager] Call error:', data);
    this.reset();
  }

  // --- MEDIA CONTROLS ---

  toggleMute() {
    if (!this.localStream) return false;
    const tracks = this.localStream.getAudioTracks();
    if (tracks.length === 0) return false;
    const nextState = !tracks[0].enabled;
    tracks.forEach(t => t.enabled = nextState);
    return !nextState; // returns isMuted
  }

  toggleVideo() {
    if (!this.localStream) return false;
    const tracks = this.localStream.getVideoTracks();
    if (tracks.length === 0) return false;
    const nextState = !tracks[0].enabled;
    tracks.forEach(t => t.enabled = nextState);
    return !nextState; // returns isVideoOff
  }
}

export const callManager = new CallManager();
