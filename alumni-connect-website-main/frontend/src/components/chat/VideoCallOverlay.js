import React, { useEffect, useRef, useState } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff,
  Video, VideoOff, Maximize2, Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall } from '../../contexts/CallContext';

/**
 * GlobalCallOverlay
 *
 * A single, always-mounted overlay rendered at the root of the app.
 * Handles three visible states:
 *  1. ringing  → full-screen incoming call popup
 *  2. outgoing → caller waiting screen
 *  3. connecting/connected → active call window (embedded or PiP)
 */
const GlobalCallOverlay = () => {
  const {
    callStatus,
    incomingCall,
    localStream,
    remoteStream,
    callInfo,
    acceptCall,
    rejectCall,
    endCall,
  } = useCall();

  const localVideoRef  = useRef(null);
  const remoteVideoRef = useRef(null);

  const [isMuted,      setIsMuted]      = useState(false);
  const [isVideoOff,   setIsVideoOff]   = useState(false);
  const [isMinimised,  setIsMinimised]  = useState(false);
  const [elapsed,      setElapsed]      = useState(0);

  // Wire streams into video elements
  useEffect(() => {
    if (localVideoRef.current  && localStream)  localVideoRef.current.srcObject  = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  // Call timer
  useEffect(() => {
    if (callStatus !== 'connected') { setElapsed(0); return; }
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [callStatus]);

  // Reset minimised when call ends
  useEffect(() => {
    if (callStatus === 'idle') setIsMinimised(false);
  }, [callStatus]);

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach(t => (t.enabled = isMuted));
    setIsMuted(m => !m);
  };

  const toggleVideo = () => {
    localStream?.getVideoTracks().forEach(t => (t.enabled = isVideoOff));
    setIsVideoOff(v => !v);
  };

  // ── 1. Incoming call (ringing) ────────────────────────────────────────
  if (callStatus === 'ringing' && incomingCall) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-gray-200 dark:border-gray-700"
        >
          {/* Avatar pulse ring */}
          <div className="relative mx-auto mb-6 w-24 h-24">
            <span className="absolute inset-0 rounded-full bg-green-400/30 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center shadow-lg">
              {incomingCall.isVideo
                ? <Video  className="w-10 h-10 text-white" />
                : <Phone  className="w-10 h-10 text-white" />}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {incomingCall.callerName || 'Unknown'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm tracking-wide uppercase">
            Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call
          </p>

          <div className="flex justify-center gap-10">
            {/* Decline */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={rejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={acceptCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 animate-bounce"
              >
                <Phone className="w-7 h-7" />
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">Accept</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── 2. Outgoing call (waiting for the other person) ───────────────────
  if (callStatus === 'outgoing') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1,    opacity: 1  }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-gray-200 dark:border-gray-700"
        >
          <div className="relative mx-auto mb-6 w-24 h-24">
            <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" />
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              {callInfo?.isVideo
                ? <Video className="w-10 h-10 text-white" />
                : <Phone className="w-10 h-10 text-white" />}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Calling…</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
            Waiting for the other person to answer
          </p>

          <button
            onClick={() => endCall('cancelled')}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg mx-auto transition-all hover:scale-110"
          >
            <PhoneOff className="w-7 h-7" />
          </button>
          <p className="text-xs text-gray-400 mt-3">Cancel</p>
        </motion.div>
      </div>
    );
  }

  // ── 3. Active call (connecting or connected) ──────────────────────────
  if (callStatus === 'connecting' || callStatus === 'connected') {
    // Minimised PiP
    if (isMinimised) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1   }}
          className="fixed bottom-6 right-6 z-[9999] w-48 h-32 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 cursor-pointer group"
        >
          {remoteStream
            ? <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-white text-xs">Connecting…</div>}

          {/* Expand + Hang up controls revealed on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button onClick={() => setIsMinimised(false)} className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={() => endCall()} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>

          {/* Timer */}
          {callStatus === 'connected' && (
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {formatTime(elapsed)}
            </div>
          )}
        </motion.div>
      );
    }

    // Full / expanded active call
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-950 flex flex-col">
        {/* Remote stream background */}
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-medium text-lg">Connecting…</p>
            <p className="text-gray-400 text-sm mt-1">Setting up peer connection</p>
          </div>
        )}

        {/* Local video PiP */}
        <div className="absolute top-4 right-4 w-32 h-44 bg-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-700 z-10">
          {localStream && !isVideoOff ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-500" />
            </div>
          )}
        </div>

        {/* Top bar: status + minimise */}
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-10">
          <div className="flex items-center gap-2">
            {callStatus === 'connected'
              ? <><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /><span className="text-white text-sm font-medium">{formatTime(elapsed)}</span></>
              : <span className="text-gray-300 text-sm">Connecting…</span>}
          </div>
          <button onClick={() => setIsMinimised(true)} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors">
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center gap-6 z-10">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* End call */}
          <button
            onClick={() => endCall()}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl transition-all hover:scale-110"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Toggle video */}
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GlobalCallOverlay;
