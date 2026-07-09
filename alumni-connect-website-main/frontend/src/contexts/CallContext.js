import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useSocket } from './SocketContext';
import VideoCallOverlay from '../components/chat/VideoCallOverlay';

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
        toast.error('Failed to access media devices. Note: WebRTC requires an HTTPS connection on mobile devices.');
      }
      throw err;
    }
  }, []);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(iceServers);
    iceCandidateQueue.current = [];
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
      socket.emit('call:end', { targetId: incomingCall.callerId });
      setIncomingCall(null);
      setCallStatus('idle');
    }
  };

  const endCall = useCallback(() => {
    if (activeCallTargetId.current && socket) {
      socket.emit('call:end', { targetId: activeCallTargetId.current });
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    activeCallTargetId.current = null;
    iceCandidateQueue.current = [];
    isRemoteDescriptionSet.current = false;
    setLocalStream(null);
    setRemoteStream(null);
    setIsCalling(false);
    setIncomingCall(null);
    setCallStatus('idle');
  }, [localStream, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data) => {
      if (callStatus === 'idle') {
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
      if (peerConnection.current) {
        if (isRemoteDescriptionSet.current) {
          try {
            await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (e) {
            console.error('Error adding received ice candidate', e);
          }
        } else {
          iceCandidateQueue.current.push(data.candidate);
        }
      }
    };

    const handleEnded = () => {
      endCall();
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
  }, [socket, callStatus, endCall]);

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
      <VideoCallOverlay
        localStream={localStream}
        remoteStream={remoteStream}
        callStatus={callStatus}
        incomingCall={incomingCall}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEndCall={endCall}
      />
    </CallContext.Provider>
  );
};
