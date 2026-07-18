import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, PhoneOff, User, Mic, MicOff, VideoOff, Maximize, Minimize } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';

const VideoCallOverlay = () => {
  const { 
    callStatus, 
    incomingCall, 
    callInfo, 
    localStream,
    remoteStream,
    remoteStreamTrigger,
    acceptCall, 
    rejectCall, 
    endCall,
    toggleVideo,
    toggleAudio
  } = useCall();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let interval;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callStatus]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(err => {
        console.warn('Browser blocked autoplay of remote stream:', err);
      });
    }
  }, [remoteStream, remoteStreamTrigger, callStatus]);

  const handleToggleAudio = () => {
    toggleAudio();
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setIsVideoOff(!isVideoOff);
  };

  if (callStatus === 'idle') return null;

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-[9999] flex items-center justify-center ${callStatus === 'connected' ? 'bg-gray-900' : 'bg-black/40 backdrop-blur-sm pointer-events-none'}`}>
        
        {/* Ringing State */}
        {callStatus === 'ringing' && incomingCall && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -50 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-6 pointer-events-auto border border-gray-200 dark:border-gray-700 min-w-[320px]"
          >
            <div className="relative">
              <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center overflow-hidden z-10 relative">
                <User className="w-12 h-12 text-primary-500" />
              </div>
              <div className="absolute inset-0 bg-primary-400 rounded-full animate-ping opacity-20"></div>
              <div className="absolute -inset-4 bg-primary-400 rounded-full animate-pulse opacity-10"></div>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {incomingCall.callerName}
              </h2>
              <p className="text-primary-600 dark:text-primary-400 font-medium animate-pulse">
                Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call...
              </p>
            </div>

            <div className="flex space-x-6 w-full justify-center pt-4">
              <button
                onClick={rejectCall}
                className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <button
                onClick={acceptCall}
                className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-lg animate-bounce"
              >
                {incomingCall.isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
              </button>
            </div>
          </motion.div>
        )}

        {/* Outgoing State */}
        {callStatus === 'outgoing' && callInfo && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-6 pointer-events-auto border border-gray-200 dark:border-gray-700 min-w-[320px]"
          >
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center relative overflow-hidden">
              {callInfo.isVideo && localStream ? (
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/40 backdrop-blur-sm flex justify-center items-center">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Calling...</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Waiting for answer</p>
            </div>

            <button
              onClick={() => endCall('ended')}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-lg"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </motion.div>
        )}

        {/* Connected State (Simple-Peer Native) */}
        {callStatus === 'connected' && (
          <div className="absolute inset-0 w-full h-full pointer-events-auto flex flex-col bg-gray-900 text-white">
            
            {/* Timer Overlay */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md px-5 py-2 rounded-full text-white font-mono text-xl shadow-2xl border border-white/10 tracking-wider">
              {formatDuration(callDuration)}
            </div>

            {/* Main Remote Video */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              {!remoteStream ? (
                <div className="flex flex-col items-center text-gray-400">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                  <p>Connecting P2P Video...</p>
                </div>
              ) : (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}

              {/* Floating Local Video */}
              <div className={`absolute ${isFullscreen ? 'bottom-24 right-4' : 'top-4 right-4'} w-32 md:w-48 aspect-[3/4] bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 transition-all duration-300 z-10`}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'} -scale-x-100`}
                />
                {isVideoOff && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <User className="w-8 h-8 text-gray-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="h-20 bg-gray-900/90 backdrop-blur-md flex items-center justify-center space-x-6 px-4 pb-safe">
              <button
                onClick={handleToggleAudio}
                className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              
              <button
                onClick={() => endCall('ended')}
                className="p-5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-transform hover:scale-105"
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              <button
                onClick={handleToggleVideo}
                className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default VideoCallOverlay;
