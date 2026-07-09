import React, { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Maximize, Minimize } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VideoCallOverlay = ({ 
  localStream, 
  remoteStream, 
  callStatus, 
  incomingCall, 
  onAccept, 
  onReject, 
  onEndCall 
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // If there's an incoming call ringing
  if (callStatus === 'ringing' && incomingCall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-700 text-center"
        >
          <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            {incomingCall.isVideo ? (
              <Video className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            ) : (
              <Phone className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {incomingCall.callerName}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call...
          </p>
          <div className="flex justify-center space-x-6">
            <button 
              onClick={onReject}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button 
              onClick={onAccept}
              className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 animate-bounce"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active or Connecting Call
  if (callStatus === 'connecting' || callStatus === 'connected') {
    return (
      <div className={`fixed z-50 transition-all duration-300 ${isFullscreen ? 'inset-0' : 'bottom-6 right-6 w-96 h-[500px]'}`}>
        <div className="relative w-full h-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700/50">
          
          {/* Remote Video (Main Background) */}
          {remoteStream ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-white font-medium">Connecting...</p>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-28 h-40 bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700/50 z-10">
            {localStream && !isVideoOff ? (
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted // Always mute local video playback to prevent echo
                className="w-full h-full object-cover transform -scale-x-100" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <VideoOff className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>

          {/* Call Controls Overlay */}
          <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-end space-x-4">
            
            <button 
              onClick={toggleMute}
              className={`p-4 rounded-full backdrop-blur-md transition-colors ${isMuted ? 'bg-red-500/90 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button 
              onClick={toggleVideo}
              className={`p-4 rounded-full backdrop-blur-md transition-colors ${isVideoOff ? 'bg-red-500/90 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            <button 
              onClick={onEndCall}
              className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-transform hover:scale-110"
            >
              <PhoneOff className="w-5 h-5" />
            </button>

            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-4 rounded-full backdrop-blur-md bg-white/20 text-white hover:bg-white/30 transition-colors absolute right-6 bottom-6 hidden md:block"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default VideoCallOverlay;
