import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Globe, 
  Smartphone, 
  Mail, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  ShieldCheck, 
  CheckCircle2,
  Flame,
  Briefcase,
  Users
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { webPushManager, getDeviceDetails } from '../../utils/webPushManager';
import { mobilePushManager } from '../../utils/mobilePushManager';
import { Capacitor } from '@capacitor/core';

export const NotificationSettingsCard = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  // Web Push state
  const isWebSupported = webPushManager.isSupported();
  const [webPermission, setWebPermission] = useState(webPushManager.getPermission());
  const [hasWebSubscription, setHasWebSubscription] = useState(false);
  const [deviceInfo] = useState(getDeviceDetails());

  // Native App state
  const isNative = Capacitor.isNativePlatform();
  const [mobilePermission, setMobilePermission] = useState('prompt');
  const [registeringMobile, setRegisteringMobile] = useState(false);

  // Test Runner state
  const [testingChannel, setTestingChannel] = useState(null);
  const [testResult, setTestResult] = useState(null);

  // Device Diagnostics state (Phase 11)
  const [devices, setDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Load registered push devices from backend
  const fetchDevices = async () => {
    try {
      setLoadingDevices(true);
      const res = await api.get('/notifications/devices');
      setDevices(res.data?.devices || []);
    } catch (err) {
      console.warn('[NotificationSettingsCard] Could not load devices:', err.message);
    } finally {
      setLoadingDevices(false);
    }
  };

  // Inspect Android notification runtime permission
  const checkMobilePermission = async () => {
    if (!mobilePushManager.isSupported()) return;
    try {
      const perm = await mobilePushManager.checkPermission();
      setMobilePermission(perm);
    } catch (_) {}
  };

  // Explicitly register Android device with Firebase and backend
  const handleRegisterMobileDevice = async () => {
    if (!mobilePushManager.isSupported()) {
      toast.error('Mobile push is only available within the Android APK.');
      return;
    }
    try {
      setRegisteringMobile(true);
      toast.loading('Registering Android device with Firebase...', { id: 'fcm-reg' });
      const result = await mobilePushManager.requestPermissionAndRegister();
      if (result.success) {
        toast.success('Android device registered for push notifications!', { id: 'fcm-reg' });
        await updatePreference('mobileAppEnabled', true);
        await checkMobilePermission();
        await fetchDevices();
      } else {
        toast.error(result.message || 'Registration failed', { id: 'fcm-reg' });
        await checkMobilePermission();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to register mobile device', { id: 'fcm-reg' });
    } finally {
      setRegisteringMobile(false);
    }
  };

  // Sync and refresh devices
  const handleRefreshDevices = async () => {
    try {
      setLoadingDevices(true);
      if (isNative) {
        await mobilePushManager.syncRegistration().catch(() => {});
        await checkMobilePermission();
      }
      await fetchDevices();
    } finally {
      setLoadingDevices(false);
    }
  };

  // Load preferences from backend
  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/preferences');
      setPreferences(res.data?.preferences || {});
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
      toast.error('Could not load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  // Inspect existing web subscription
  const checkWebSubscription = async () => {
    if (!isWebSupported) return;
    setWebPermission(webPushManager.getPermission());
    const sub = await webPushManager.getExistingSubscription();
    setHasWebSubscription(Boolean(sub));
  };

  useEffect(() => {
    fetchPreferences();
    checkWebSubscription();
    checkMobilePermission();
    fetchDevices();
  }, []);

  // Update a single preference with optimistic UI, error handling, and rollback
  const updatePreference = async (key, nextValue) => {
    if (!preferences) return;
    const previousValue = preferences[key];

    // Optimistic update
    setPreferences(prev => ({ ...prev, [key]: nextValue }));
    setSavingKey(key);

    try {
      const res = await api.put('/notifications/preferences', { [key]: nextValue });
      if (res.data?.preferences) {
        setPreferences(res.data.preferences);
      }
      toast.success('Preference saved');
    } catch (err) {
      // Rollback on failure
      setPreferences(prev => ({ ...prev, [key]: previousValue }));
      const msg = err.response?.data?.message || err.message || 'Failed to save preference';
      toast.error(`Could not save: ${msg}`);
    } finally {
      setSavingKey(null);
    }
  };

  // Handle Web Push master toggle
  const handleToggleWebPush = async () => {
    const isCurrentlyEnabled = preferences?.webPushEnabled !== false && hasWebSubscription;
    setSavingKey('webPushEnabled');

    if (!isCurrentlyEnabled) {
      // Turn ON: request permission, subscribe, sync with backend
      try {
        await webPushManager.subscribe();
        setWebPermission('granted');
        setHasWebSubscription(true);
        await updatePreference('webPushEnabled', true);
        toast.success('Web Push notifications enabled!');
      } catch (err) {
        setWebPermission(webPushManager.getPermission());
        toast.error(err.message || 'Failed to enable Web Push');
        // Re-check subscription status
        await checkWebSubscription();
      } finally {
        setSavingKey(null);
        fetchDevices();
      }
    } else {
      // Turn OFF
      try {
        await webPushManager.unsubscribe();
        setHasWebSubscription(false);
        await updatePreference('webPushEnabled', false);
        toast.success('Web Push notifications disabled');
      } catch (err) {
        toast.error('Could not disable Web Push');
      } finally {
        setSavingKey(null);
        fetchDevices();
      }
    }
  };

  // Run channel test
  const handleRunTest = async (channel) => {
    try {
      setTestingChannel(channel);
      setTestResult(null);

      // Pre-sync device endpoint with backend to guarantee registration
      if (channel === 'android') {
        await mobilePushManager.syncRegistration().catch(() => {});
      } else if (channel === 'web') {
        await webPushManager.syncSubscription().catch(() => {});
      }

      const res = await webPushManager.sendTest(channel);
      setTestResult({
        channel,
        success: res.success,
        message: res.message,
        deliveredCount: res.deliveredCount,
        details: res.details || res.result
      });

      if (res.success) {
        toast.success(res.message || `${channel.toUpperCase()} test delivered!`);
      } else {
        toast.error(res.message || `${channel.toUpperCase()} test failed`);
      }
      fetchDevices();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Test failed';
      setTestResult({ channel, success: false, message: msg });
      toast.error(msg);
    } finally {
      setTestingChannel(null);
      fetchDevices();
    }
  };

  if (loading && !preferences) {
    return (
      <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mr-2" />
        <span className="text-xs text-gray-500">Loading notification settings...</span>
      </div>
    );
  }

  const isWebPushActive = Boolean(preferences?.webPushEnabled !== false && hasWebSubscription && webPermission === 'granted');

  return (
    <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-500" />
            <span>Notification & Push Settings</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage real-time browser push, mobile APK alerts, in-app updates, and selective email rules.
          </p>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. DELIVERY CHANNELS
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Delivery Channels
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Channel A: In-App Notifications */}
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 flex items-center justify-between gap-3 shadow-xs">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">In-App Notification Center</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Real-time activity bell, unread badge counters, and interactive alerts.
              </p>
            </div>
            <button
              type="button"
              disabled={savingKey === 'inAppEnabled'}
              onClick={() => updatePreference('inAppEnabled', preferences?.inAppEnabled === false)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 flex-shrink-0 ${
                preferences?.inAppEnabled !== false ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <span className={`w-4 h-4 rounded-full bg-white transition-transform ${
                preferences?.inAppEnabled !== false ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Channel B: Web Push Notifications */}
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 flex flex-col justify-between gap-3 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Browser Web Push</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Native OS notifications even when the Alumnex tab is minimized or closed.
                </p>
              </div>
              <button
                type="button"
                disabled={savingKey === 'webPushEnabled'}
                onClick={handleToggleWebPush}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 flex-shrink-0 ${
                  isWebPushActive ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                {savingKey === 'webPushEnabled' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-white animate-spin mx-auto" />
                ) : (
                  <span className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    isWebPushActive ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                )}
              </button>
            </div>

            {/* Browser Permission & Subscription Diagnostics */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center gap-2 text-[11px]">
              <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                webPermission === 'granted'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : webPermission === 'denied'
                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
              }`}>
                Permission: {webPermission}
              </span>

              <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                hasWebSubscription
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                  : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
              }`}>
                Subscription: {hasWebSubscription ? 'Active' : 'Missing'}
              </span>

              <span className="text-gray-400 ml-auto truncate max-w-[150px]">
                {deviceInfo.deviceName}
              </span>
            </div>
          </div>

          {/* Channel C: Mobile App Notifications (Capacitor APK) */}
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 flex flex-col justify-between gap-3 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Alumnex Android APK</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Push notifications delivered straight to your Android status bar.
                </p>
              </div>
              <button
                type="button"
                disabled={savingKey === 'mobileAppEnabled' || registeringMobile}
                onClick={async () => {
                  const nextVal = preferences?.mobileAppEnabled === false;
                  if (nextVal && isNative) {
                    await handleRegisterMobileDevice();
                  } else {
                    await updatePreference('mobileAppEnabled', nextVal);
                  }
                }}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 flex-shrink-0 ${
                  preferences?.mobileAppEnabled !== false ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                {registeringMobile ? (
                  <RefreshCw className="w-3.5 h-3.5 text-white animate-spin mx-auto" />
                ) : (
                  <span className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    preferences?.mobileAppEnabled !== false ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                  isNative
                    ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                    : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/80 dark:text-gray-400 dark:border-gray-700'
                }`}>
                  {isNative ? 'Capacitor APK Active' : 'Web Session (APK Ready)'}
                </span>

                {isNative && (
                  <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                    mobilePermission === 'granted'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : mobilePermission === 'denied'
                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                  }`}>
                    Permission: {mobilePermission}
                  </span>
                )}
              </div>

              {isNative && !devices.some(d => d.platform === 'android' && d.enabled) && (
                <button
                  type="button"
                  onClick={handleRegisterMobileDevice}
                  disabled={registeringMobile}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-[11px] flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3 h-3 ${registeringMobile ? 'animate-spin' : ''}`} />
                  <span>Register Device</span>
                </button>
              )}
            </div>
          </div>

          {/* Channel D: Selective Email Notifications */}
          <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 flex flex-col justify-between gap-3 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Email Notification Policy</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Keep your inbox clean. Email is reserved for OTP and critical alerts.
                </p>
              </div>

              <select
                value={preferences?.emailMode || 'important_only'}
                onChange={(e) => updatePreference('emailMode', e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none"
              >
                <option value="important_only">Important Alerts Only (Recommended)</option>
                <option value="all">All Reminders</option>
                <option value="none">None (In-App & Push Only)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-400">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>OTP & Security always delivered</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. CATEGORY PREFERENCES
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Notification Categories
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category: Activity & Streaks */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <Flame className="w-4 h-4 text-amber-500" />
              <p className="font-bold text-sm text-gray-900 dark:text-white">Activity & Streaks</p>
            </div>

            {[
              { key: 'streakAlert', label: 'Streak at risk (3h before reset)', defaultVal: true },
              { key: 'milestoneAlert', label: 'Streak milestones (7, 14, 30+ days)', defaultVal: true },
              { key: 'dailyReminder', label: 'Evening incomplete goal reminders', defaultVal: true },
              { key: 'goalCompletion', label: 'Goal completion celebrations', defaultVal: false },
              { key: 'weeklySummary', label: 'Weekly consistency summaries', defaultVal: true }
            ].map(item => {
              const checked = preferences?.[item.key] !== false;
              return (
                <label key={item.key} className="flex items-center justify-between text-xs cursor-pointer group">
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 transition-colors">
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => updatePreference(item.key, !checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                  />
                </label>
              );
            })}
          </div>

          {/* Category: Career & Opportunities */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <p className="font-bold text-sm text-gray-900 dark:text-white">Career & Mentorship</p>
            </div>

            {[
              { key: 'interviewReminder', label: 'Mock interview & session alerts', defaultVal: true },
              { key: 'mentorshipReminder', label: '1:1 Mentorship schedules with Meet links', defaultVal: true },
              { key: 'jobAlerts', label: 'New verified alumni job postings', defaultVal: false }
            ].map(item => {
              const checked = preferences?.[item.key] !== false;
              return (
                <label key={item.key} className="flex items-center justify-between text-xs cursor-pointer group">
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 transition-colors">
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => updatePreference(item.key, !checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                  />
                </label>
              );
            })}
          </div>

          {/* Category: Social & Community */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <Users className="w-4 h-4 text-emerald-500" />
              <p className="font-bold text-sm text-gray-900 dark:text-white">Social & Messaging</p>
            </div>

            {[
              { key: 'chatMessages', label: 'Direct chat messages & mentions', defaultVal: true },
              { key: 'connectionRequests', label: 'Alumni connection & follow requests', defaultVal: true },
              { key: 'socialReactions', label: 'Forum replies & post reactions', defaultVal: false }
            ].map(item => {
              const checked = preferences?.[item.key] !== false;
              return (
                <label key={item.key} className="flex items-center justify-between text-xs cursor-pointer group">
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 transition-colors">
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => updatePreference(item.key, !checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                  />
                </label>
              );
            })}
          </div>

          {/* Category: System & Security */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <p className="font-bold text-sm text-gray-900 dark:text-white">System & Security</p>
            </div>

            {[
              { key: 'securityAlerts', label: 'Security & login notices', defaultVal: true },
              { key: 'systemAnnouncements', label: 'Critical platform announcements', defaultVal: true },
              { key: 'platformUpdates', label: 'Sync updates from GitHub/LeetCode', defaultVal: false }
            ].map(item => {
              const checked = preferences?.[item.key] !== false;
              return (
                <label key={item.key} className="flex items-center justify-between text-xs cursor-pointer group">
                  <span className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 transition-colors">
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => updatePreference(item.key, !checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600"
                  />
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. REAL TESTING SUITE
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/40 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200/60 dark:border-indigo-800/40 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Multi-Channel Notification Test Suite</span>
          </h4>
          <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
            Trigger a real notification through any channel to verify end-to-end delivery on your device.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={testingChannel !== null}
            onClick={() => handleRunTest('web')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {testingChannel === 'web' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            <span>Test Web Push</span>
          </button>

          <button
            type="button"
            disabled={testingChannel !== null}
            onClick={() => handleRunTest('android')}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {testingChannel === 'android' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
            <span>Test Android APK</span>
          </button>

          <button
            type="button"
            disabled={testingChannel !== null}
            onClick={() => handleRunTest('in-app')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {testingChannel === 'in-app' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
            <span>Test In-App Bell</span>
          </button>
        </div>

        {/* Live Test Diagnostic Output */}
        {testResult && (
          <div className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
              <span>{testResult.channel.toUpperCase()} Dispatch Report: {testResult.success ? 'Delivered' : 'Action Required'}</span>
            </div>
            <p className="text-[11px] opacity-90 whitespace-pre-line font-mono">{testResult.message}</p>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. NOTIFICATION DEVICE DIAGNOSTICS (PHASE 11)
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Registered Notification Devices & Endpoints</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live status of endpoints authorized for offline Web Push and native Android FCM delivery.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshDevices}
            disabled={loadingDevices}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Refresh devices"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDevices ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {devices.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              🔴 No active push endpoint
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {isNative
                ? 'Your Android device is not yet registered for background Firebase Cloud Messaging.'
                : 'Enable Web Push above or open the Alumnex APK to register this device for offline notifications.'}
            </p>
            {isNative && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleRegisterMobileDevice}
                  disabled={registeringMobile}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{registeringMobile ? 'Registering with Firebase...' : 'Register This Android Device Now'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map((dev) => {
              const isAndroid = dev.platform === 'android';
              const lastSeen = dev.lastSeenAt ? new Date(dev.lastSeenAt).toLocaleString() : 'Recently';
              const lastDeliv = dev.lastDeliveryAt ? new Date(dev.lastDeliveryAt).toLocaleTimeString() : 'None yet';

              return (
                <div
                  key={dev._id || dev.deviceId}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {isAndroid ? <Smartphone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {dev.deviceName || (isAndroid ? 'Android Device' : 'Web Browser')}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          🟢 Active
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 space-x-2">
                        <span>Platform: <b className="capitalize text-slate-700 dark:text-slate-300">{dev.platform}</b></span>
                        <span>•</span>
                        <span>Provider: <b className="uppercase text-slate-700 dark:text-slate-300">{dev.pushProvider}</b></span>
                        {dev.browser && (
                          <>
                            <span>•</span>
                            <span>Browser: <b className="text-slate-700 dark:text-slate-300">{dev.browser}</b></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right text-[11px] text-slate-500 dark:text-slate-400 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-700">
                    <div>Permission: <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{dev.permission || 'Granted'}</span></div>
                    <div>Last seen: <span className="text-slate-700 dark:text-slate-300">{lastSeen}</span></div>
                    {dev.lastDeliveryStatus && dev.lastDeliveryStatus !== 'none' && (
                      <div className="mt-0.5">
                        Last delivery: <span className={`font-semibold ${dev.lastDeliveryStatus === 'success' || dev.lastDeliveryStatus === 'simulated' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {dev.lastDeliveryStatus} ({lastDeliv})
                        </span>
                      </div>
                    )}
                    {dev.lastError && (
                      <div className="text-rose-500 text-[10px] max-w-xs truncate" title={dev.lastError}>
                        Error: {dev.lastError}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsCard;
