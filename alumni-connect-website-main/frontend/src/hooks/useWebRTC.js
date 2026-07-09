import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';

export const useWebRTC = (otherParticipantId) => {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, isVideo, offer }
  const [callStatus, setCallStatus] = useState('idle'); // idle, ringing, connecting, connected, ended

  const peerConnection = useRef(null);
  const activeCallTargetId = useRef(null);

  // Free public STUN servers for NAT traversal
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
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
      console.error('Failed to get media devices', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Camera/Microphone access was denied. Please grant permissions.');
      } else if (err.name === 'NotFoundError') {
        toast.error('No camera/microphone found on this device.');
      } else {
        toast.error('Failed to access media devices. Note: WebRTC requires an HTTPS connection (or localhost) on mobile devices.');
      }
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(iceServers);
    
    pc.onicecandidate = (event) => {
      if (event.candidate && activeCallTargetId.current) {
        socket.emit('call:ice-candidate', {
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
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [socket, otherParticipantId]);

  const startCall = async (isVideo = true) => {
    if (!otherParticipantId) return;
    try {
      activeCallTargetId.current = otherParticipantId;
      setCallStatus('connecting');
      setIsCalling(true);
      const stream = await getMedia(isVideo);
      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('call:request', {
        receiverId: otherParticipantId,
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
    if (!incomingCall) return;
    try {
      activeCallTargetId.current = incomingCall.callerId;
      setCallStatus('connecting');
      const stream = await getMedia(incomingCall.isVideo);
      const pc = createPeerConnection();

      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
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
    if (incomingCall) {
      socket.emit('call:end', { targetId: incomingCall.callerId });
      setIncomingCall(null);
      setCallStatus('idle');
    }
  };

  const endCall = useCallback(() => {
    if (activeCallTargetId.current) {
      socket.emit('call:end', { targetId: activeCallTargetId.current });
    } else if (otherParticipantId) {
      socket.emit('call:end', { targetId: otherParticipantId });
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    activeCallTargetId.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsCalling(false);
    setIncomingCall(null);
    setCallStatus('idle');
  }, [localStream, otherParticipantId, socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on('call:incoming', (data) => {
      // Only handle if we're looking at the right person or if we're not currently in a call
      if (callStatus === 'idle') {
        setIncomingCall(data);
        setCallStatus('ringing');
      } else {
        // Automatically reject if busy
        socket.emit('call:end', { targetId: data.callerId });
      }
    });

    socket.on('call:accepted', async (data) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socket.on('call:ice-candidate', async (data) => {
      if (peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    });

    socket.on('call:ended', () => {
      endCall();
    });

    socket.on('call:error', (data) => {
      alert(data.message);
      endCall();
    });

    return () => {
      socket.off('call:incoming');
      socket.off('call:accepted');
      socket.off('call:ice-candidate');
      socket.off('call:ended');
      socket.off('call:error');
    };
  }, [socket, callStatus, endCall]);

  return {
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
};
