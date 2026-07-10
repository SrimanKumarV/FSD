import React, { useEffect, useRef, useState } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff,
  Video, VideoOff, Minimize2, Maximize2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCall } from '../../contexts/CallContext';

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

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

  const localRef  = useRef(null);
  const remoteRef = useRef(null);

  const [isMuted,     setIsMuted]     = useState(false);
  const [isVideoOff,  setIsVideoOff]  = useState(false);
  const [minimised,   setMinimised]   = useState(false);
  const [elapsed,     setElapsed]     = useState(0);

  /* Wire streams */
  useEffect(() => {
    if (localRef.current  && localStream)  localRef.current.srcObject  = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  /* Live call timer – starts only when truly connected */
  useEffect(() => {
    if (callStatus !== 'connected') { setElapsed(0); return; }
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [callStatus]);

  /* Reset minimised on idle */
  useEffect(() => {
    if (callStatus === 'idle') {
      setMinimised(false);
      setIsMuted(false);
      setIsVideoOff(false);
    }
  }, [callStatus]);

  const toggleMute = () => {
    if (!localStream) return;
    const next = !isMuted;
    localStream.getAudioTracks().forEach(t => { t.enabled = !next; });
    setIsMuted(next);
  };

  const toggleVideo = () => {
    if (!localStream) return;
    const next = !isVideoOff;
    localStream.getVideoTracks().forEach(t => { t.enabled = !next; });
    setIsVideoOff(next);
  };

  /* ─────────────────────────────────────────────────────────────────────
     1.  RINGING  –  Incoming call popup (always full-screen, z-[9999])
  ───────────────────────────────────────────────────────────────────── */
  if (callStatus === 'ringing' && incomingCall) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-lg p-4">
        <motion.div
          key="incoming"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-10 w-full max-w-xs shadow-2xl text-center border border-gray-100 dark:border-gray-700"
        >
          {/* Pulsing avatar */}
          <div className="relative w-28 h-28 mx-auto mb-6">
            <span className="absolute inset-0 rounded-full bg-green-400/25 animate-ping" />
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl">
              {(incomingCall.callerName || '?')[0].toUpperCase()}
            </div>
          </div>

          <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
            Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call
          </p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            {incomingCall.callerName || 'Unknown'}
          </h2>

          <div className="flex justify-around">
            {/* Decline */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={rejectCall}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs text-gray-500">Decline</span>
            </div>

            {/* Accept */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={acceptCall}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg animate-bounce transition-transform active:scale-95"
              >
                <Phone className="w-7 h-7" />
              </button>
              <span className="text-xs text-gray-500">Accept</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────
     2.  OUTGOING  –  Caller waiting screen
  ───────────────────────────────────────────────────────────────────── */
  if (callStatus === 'outgoing') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-lg p-4">
        <motion.div
          key="outgoing"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          className="bg-white dark:bg-gray-900 rounded-3xl p-10 w-full max-w-xs shadow-2xl text-center border border-gray-100 dark:border-gray-700"
        >
          <div className="relative w-28 h-28 mx-auto mb-6">
            <span className="absolute inset-0 rounded-full bg-blue-400/25 animate-ping" />
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl">
              {callInfo?.isVideo
                ? <Video className="w-12 h-12" />
                : <Phone className="w-12 h-12" />}
            </div>
          </div>

          <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
            {callInfo?.isVideo ? 'Video' : 'Audio'} Call
          </p>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Calling…</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Waiting for answer</p>

          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => endCall('cancelled')}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-xs text-gray-500">Cancel</span>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────
     3.  CONNECTING / CONNECTED  –  Active call
  ───────────────────────────────────────────────────────────────────── */
  if (callStatus === 'connecting' || callStatus === 'connected') {
    /* ── Minimised PiP ── */
    if (minimised) {
      return (
        <div className="fixed bottom-5 right-5 z-[9999] w-44 h-28 rounded-2xl overflow-hidden shadow-2xl border border-gray-700 bg-gray-900 group cursor-pointer">
          {remoteStream
            ? <video ref={remoteRef} autoPlay playsInline className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Connecting…</div>}

          {/* Timer badge */}
          {callStatus === 'connected' && (
            <div className="absolute top-1.5 left-2 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full">
              {fmt(elapsed)}
            </div>
          )}

          {/* Hover controls */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button onClick={() => setMinimised(false)} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button onClick={() => endCall()} className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white">
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    /* ── Full screen active call ── */
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-950 flex flex-col select-none">

        {/* Remote stream */}
        {remoteStream ? (
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-5" />
            <p className="text-white font-semibold text-lg">Connecting…</p>
            <p className="text-gray-400 text-sm mt-1">Establishing peer connection</p>
          </div>
        )}

        {/* Local stream PiP – top right */}
        <div className="absolute top-4 right-4 w-32 h-44 bg-gray-800 rounded-2xl overflow-hidden shadow-xl border border-gray-700 z-10">
          {localStream && !isVideoOff ? (
            <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-500" />
            </div>
          )}
        </div>

        {/* Top bar: status + timer + minimise */}
        <div className="absolute top-0 inset-x-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            {callStatus === 'connected' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white font-mono font-semibold text-sm tracking-wider">{fmt(elapsed)}</span>
              </>
            ) : (
              <span className="text-gray-300 text-sm animate-pulse">Connecting…</span>
            )}
          </div>

          <button
            onClick={() => setMinimised(true)}
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 inset-x-0 z-10 p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center gap-8">
          {/* Mute toggle */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <span className="text-white/70 text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
          </div>

          {/* End call */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => endCall()}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-white/70 text-xs">End</span>
          </div>

          {/* Video toggle */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isVideoOff ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
            <span className="text-white/70 text-xs">{isVideoOff ? 'Show Cam' : 'Camera'}</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GlobalCallOverlay;
