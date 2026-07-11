import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, PhoneOff, User } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import { useAuth } from '../../contexts/AuthContext';
import { JitsiMeeting } from '@jitsi/react-sdk';

const VideoCallOverlay = () => {
  const { 
    callStatus, 
    incomingCall, 
    callInfo, 
    acceptCall, 
    rejectCall, 
    endCall 
  } = useCall();
  const { user } = useAuth();

  if (callStatus === 'idle') return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
        
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
              <User className="w-12 h-12 text-gray-400" />
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-white/20 backdrop-blur-sm flex justify-center items-center">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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

        {/* Connected State (Jitsi Embedded) */}
        {callStatus === 'connected' && callInfo && (
          <div className="fixed inset-0 bg-black z-[10000] pointer-events-auto flex flex-col">
            <JitsiMeeting
              domain="meet.jit.si"
              roomName={callInfo.roomName}
              configOverwrite={{
                startWithAudioMuted: false,
                startWithVideoMuted: !callInfo.isVideo,
                disableModeratorIndicator: true,
                startScreenSharing: false,
                enableEmailInStats: false,
                prejoinPageEnabled: false, // Skip lobby!
                disableInviteFunctions: true,
              }}
              interfaceConfigOverwrite={{
                DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                SHOW_CHROME_EXTENSION_BANNER: false,
              }}
              userInfo={{
                displayName: user?.name || 'Alumni User'
              }}
              onApiReady={(externalApi) => {
                // When the user hangs up in Jitsi, also end the call in our system
                externalApi.addListener('videoConferenceLeft', () => {
                  endCall('ended');
                });
              }}
              getIFrameRef={(iframeRef) => {
                iframeRef.style.height = '100%';
                iframeRef.style.width = '100%';
              }}
            />
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default VideoCallOverlay;
