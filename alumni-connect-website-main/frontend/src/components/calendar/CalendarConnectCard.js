import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Shield, Check, ArrowRight, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export const CalendarConnectCard = ({ isReauth = false, onConnectSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const isMobile = Capacitor.isNativePlatform();
      const response = await api.get('/google-calendar/connect', {
        params: { mode: isMobile ? 'mobile' : 'web' }
      });

      const authUrl = response.data?.authorizationUrl || response.authorizationUrl;
      if (!authUrl) {
        throw new Error('No authorization URL received');
      }

      if (isMobile) {
        // Open system browser via Capacitor Browser plugin
        await Browser.open({ url: authUrl, windowName: '_system' });
      } else {
        // Redirect current web tab
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('[CalendarConnectCard] Connect error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to start Google Calendar authorization');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full rounded-2xl border p-6 sm:p-8 backdrop-blur-xl shadow-sm transition-all ${
        isReauth
          ? 'border-amber-300 dark:border-amber-800/80 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 dark:from-amber-950/20 dark:via-gray-900 dark:to-amber-950/10'
          : 'border-blue-200 dark:border-blue-900/60 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 dark:from-blue-950/20 dark:via-gray-900 dark:to-indigo-950/20'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-3 rounded-2xl ${isReauth ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'}`}>
              {isReauth ? <AlertCircle className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Google Workspace Integration
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {isReauth ? 'Reconnect Google Calendar' : 'Connect Your Google Calendar'}
              </h2>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            {isReauth
              ? 'Your Google authorization expired or was revoked. Reconnect your account to resume real-time sync with Alumnex events, mentorship, and schedule intelligence.'
              : 'Synchronize your academic schedule, personal events, 1:1 mentorship sessions, and campus events in one unified view with smart free-time detection.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span>View calendar events inside Alumnex</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span>Add Alumnex events to Google Calendar</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span>Automatic Google Meet links for mentorship</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span>Disconnect anytime from Settings</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center flex-shrink-0">
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 text-white ${
              isReauth
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Opening Google...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                <span>{isReauth ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
            <Shield className="w-3.5 h-3.5 text-gray-400" />
            <span>OAuth 2.0 least-privilege access</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CalendarConnectCard;
