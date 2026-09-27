import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Bell, 
  Clock, 
  Moon, 
  ShieldAlert, 
  Download, 
  Trash2, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  X, 
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const POPULAR_TIMEZONES = [
  { region: 'India', tz: 'Asia/Kolkata', label: 'India Standard Time (IST, UTC+5:30)' },
  { region: 'United Kingdom', tz: 'Europe/London', label: 'London / GMT (UTC+0 / UTC+1)' },
  { region: 'United States (East)', tz: 'America/New_York', label: 'Eastern Time (EST/EDT, UTC-5 / UTC-4)' },
  { region: 'United States (Central)', tz: 'America/Chicago', label: 'Central Time (CST/CDT, UTC-6 / UTC-5)' },
  { region: 'United States (West)', tz: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT, UTC-8 / UTC-7)' },
  { region: 'Singapore', tz: 'Asia/Singapore', label: 'Singapore Time (SGT, UTC+8)' },
  { region: 'Japan', tz: 'Asia/Tokyo', label: 'Japan Standard Time (JST, UTC+9)' },
  { region: 'United Arab Emirates', tz: 'Asia/Dubai', label: 'Gulf Standard Time (GST, UTC+4)' },
  { region: 'Australia (Sydney)', tz: 'Australia/Sydney', label: 'Australian Eastern Time (AEST, UTC+10 / UTC+11)' },
  { region: 'Germany / Central Europe', tz: 'Europe/Berlin', label: 'Central European Time (CET/CEST, UTC+1 / UTC+2)' },
  { region: 'Canada (Toronto)', tz: 'America/Toronto', label: 'Eastern Time (EDT, UTC-4)' }
];

const WEEKDAYS = [
  { day: 0, label: 'Sun', full: 'Sunday' },
  { day: 1, label: 'Mon', full: 'Monday' },
  { day: 2, label: 'Tue', full: 'Tuesday' },
  { day: 3, label: 'Wed', full: 'Wednesday' },
  { day: 4, label: 'Thu', full: 'Thursday' },
  { day: 5, label: 'Fri', full: 'Friday' },
  { day: 6, label: 'Sat', full: 'Saturday' },
];

const ActivitySettings = ({ initialPreferences, onPreferencesSaved, onDataReset, onOpenPlatforms }) => {
  const [activeSection, setActiveSection] = useState('timezone');
  const [preferences, setPreferences] = useState(initialPreferences || {});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Timezone Detection & Modal State
  const [showTzModal, setShowTzModal] = useState(false);
  const [tzSearch, setTzSearch] = useState('');
  const [pendingTz, setPendingTz] = useState(null);
  const [showTzWarning, setShowTzWarning] = useState(false);

  // Live Local Time Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Privacy Confirmation Modal State
  const [privacyModalType, setPrivacyModalType] = useState(null); // 'clear-records' | 'delete-all'
  const [deleteInputText, setDeleteInputText] = useState('');
  const [isProcessingPrivacy, setIsProcessingPrivacy] = useState(false);

  // Auto-detect browser timezone
  const browserTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    } catch {
      return 'Asia/Kolkata';
    }
  }, []);

  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
    }
  }, [initialPreferences]);

  // Keep live local clock updated every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeTz = preferences.timezone || browserTimezone;
  const isAutoDetected = !preferences.timezone || preferences.timezone === browserTimezone;

  const formattedLocalTime = useMemo(() => {
    try {
      return currentTime.toLocaleTimeString('en-US', {
        timeZone: activeTz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return currentTime.toLocaleTimeString();
    }
  }, [currentTime, activeTz]);

  const formattedLocalDate = useMemo(() => {
    try {
      return currentTime.toLocaleDateString('en-US', {
        timeZone: activeTz,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return currentTime.toLocaleDateString();
    }
  }, [currentTime, activeTz]);

  // Save preferences to backend
  const savePreferences = async (updatedPrefs) => {
    const payload = updatedPrefs || preferences;
    setIsSaving(true);
    try {
      const res = await api.put('/activity/preferences', payload);
      setPreferences(res.data);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast.success('Preferences saved');
      if (onPreferencesSaved) {
        onPreferencesSaved(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle helper
  const handleToggle = (key) => {
    const nextVal = !preferences[key];
    const updated = { ...preferences, [key]: nextVal };
    setPreferences(updated);
    savePreferences(updated);
  };

  // Day selection toggle (Sunday = 0, Monday = 1, ...)
  const toggleReminderDay = (dayIndex) => {
    const currentDays = preferences.reminderDays || [1, 2, 3, 4, 5];
    const exists = currentDays.includes(dayIndex);
    const updatedDays = exists
      ? currentDays.filter(d => d !== dayIndex)
      : [...currentDays, dayIndex].sort();

    if (updatedDays.length === 0) {
      toast.error('Select at least one reminder day');
      return;
    }

    const updated = { ...preferences, reminderDays: updatedDays };
    setPreferences(updated);
    savePreferences(updated);
  };

  // Timezone selection with warning confirmation
  const initiateTimezoneChange = (newTz) => {
    if (newTz === activeTz) {
      setShowTzModal(false);
      return;
    }
    setPendingTz(newTz);
    setShowTzModal(false);
    setShowTzWarning(true);
  };

  const confirmTimezoneChange = () => {
    if (!pendingTz) return;
    const updated = { ...preferences, timezone: pendingTz };
    setPreferences(updated);
    savePreferences(updated);
    setShowTzWarning(false);
    setPendingTz(null);
    toast.success(`Timezone updated to ${pendingTz}`);
  };

  // Export Activity Data
  const handleExportData = async () => {
    try {
      const res = await api.get('/activity/export');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `alumnex-activity-export-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('Activity data exported successfully');
    } catch (err) {
      toast.error('Failed to export activity data');
    }
  };

  // Clear Activity Records Only
  const handleClearRecords = async () => {
    setIsProcessingPrivacy(true);
    try {
      await api.delete('/activity/records');
      toast.success('Activity history cleared. Goals and settings are preserved.');
      setPrivacyModalType(null);
      if (onDataReset) onDataReset();
    } catch (err) {
      toast.error('Failed to clear activity history');
    } finally {
      setIsProcessingPrivacy(false);
    }
  };

  // Delete All Activity Data (Permanently)
  const handleDeleteAll = async () => {
    if (deleteInputText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Type DELETE to confirm permanent deletion');
      return;
    }
    setIsProcessingPrivacy(true);
    try {
      await api.delete('/activity/data');
      toast.success('All activity tracking data deleted permanently');
      setPrivacyModalType(null);
      setDeleteInputText('');
      if (onDataReset) onDataReset();
    } catch (err) {
      toast.error('Failed to delete activity data');
    } finally {
      setIsProcessingPrivacy(false);
    }
  };

  // Filtered Timezones
  const filteredTimezones = useMemo(() => {
    if (!tzSearch.trim()) return POPULAR_TIMEZONES;
    const q = tzSearch.toLowerCase();
    return POPULAR_TIMEZONES.filter(
      item => item.region.toLowerCase().includes(q) || item.tz.toLowerCase().includes(q) || item.label.toLowerCase().includes(q)
    );
  }, [tzSearch]);

  const navItems = [
    { id: 'timezone', label: 'Timezone & Local Time', icon: Globe },
    { id: 'notifications', label: 'Notification Types', icon: Bell },
    { id: 'schedule', label: 'Daily Reminder Schedule', icon: Clock },
    { id: 'quiethours', label: 'Quiet Hours', icon: Moon },
    { id: 'automation', label: 'Automation Status', icon: Sparkles },
    { id: 'privacy', label: 'Data & Privacy', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/50 dark:border-gray-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
            Activity Preferences Center
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Configure how Alumnex tracks your daily momentum, schedules reminders, and protects your privacy.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastSavedTime && (
            <span className="text-xs text-emerald-500 font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Saved at {lastSavedTime}</span>
            </span>
          )}
          {isSaving && (
            <span className="text-xs text-indigo-500 font-medium flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 pb-1">
            Settings Categories
          </p>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const isDanger = item.id === 'privacy';

            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left ${
                  isActive
                    ? isDanger
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-sm'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? (isDanger ? 'text-rose-500' : 'text-indigo-500') : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'translate-x-0.5 opacity-100' : 'opacity-30'}`} />
              </button>
            );
          })}
        </div>

        {/* Right Active Setting Panel */}
        <div className="lg:col-span-8">
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-gray-200/60 dark:border-gray-800 shadow-xl space-y-6">

            {/* 1. TIMEZONE & LOCAL CLOCK */}
            {activeSection === 'timezone' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-500" />
                    <span>Timezone & Daily Streak Reset</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your activity day and streak transitions are calculated based on this local timezone to prevent premature streak resets.
                  </p>
                </div>

                {/* Live Local Clock Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                    Your Current Local Time
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight font-mono">
                      {formattedLocalTime}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                    {formattedLocalDate}
                  </p>
                </div>

                {/* Timezone Status Card */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                        {activeTz}
                      </span>
                      {isAutoDetected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          Automatically detected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                          Manually selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Detected from browser: <strong className="text-gray-700 dark:text-gray-300">{browserTimezone}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTzModal(true)}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                    >
                      Change Timezone
                    </button>
                    {!isAutoDetected && (
                      <button
                        type="button"
                        onClick={() => initiateTimezoneChange(browserTimezone)}
                        className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-300 transition-all"
                        title="Reset to browser timezone"
                      >
                        Reset to Auto
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    Your daily goals reset at midnight in this timezone. Completing activities before 11:59 PM local time safeguards your streak.
                  </span>
                </div>
              </div>
            )}

            {/* 2. NOTIFICATIONS */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-500" />
                    <span>Notification Preferences</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select which types of activity alerts you want to receive across in-app channels and email.
                  </p>
                </div>

                {/* Delivery Master Switches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">In-App Notifications</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Bell badge & dashboard alerts</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('inAppEnabled')}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                        preferences.inAppEnabled !== false ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        preferences.inAppEnabled !== false ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Email Digests</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Weekly summaries & warnings</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle('emailEnabled')}
                      className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                        preferences.emailEnabled !== false ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        preferences.emailEnabled !== false ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Detailed Event Switches */}
                <div className="space-y-3 pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Activity Alert Events
                  </p>

                  {[
                    {
                      key: 'dailyReminder',
                      title: 'Daily Reminders',
                      desc: 'Alert me in the evening when scheduled daily goals remain incomplete.'
                    },
                    {
                      key: 'streakAlert',
                      title: 'Streak Risk Alerts',
                      desc: 'Urgent notice when an active multi-day streak is at risk of expiring today.'
                    },
                    {
                      key: 'milestoneAlert',
                      title: 'Milestone Celebrations',
                      desc: 'Congratulatory alerts when hitting 7, 14, 30, 50, 100+ day streak milestones.'
                    },
                    {
                      key: 'weeklySummary',
                      title: 'Weekly Sunday Summary',
                      desc: 'A comprehensive digest of your consistency, active days, and category growth every Sunday.'
                    },
                    {
                      key: 'platformUpdates',
                      title: 'Platform Sync Updates',
                      desc: 'Notifications when external platforms sync new coding records or lessons.'
                    }
                  ].map(opt => {
                    const isEnabled = preferences[opt.key] !== false;
                    return (
                      <div
                        key={opt.key}
                        className="p-4 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-gray-200/60 dark:border-gray-800 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{opt.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{opt.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggle(opt.key)}
                          className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 flex-shrink-0 ${
                            isEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. SCHEDULE & DAYS (Starting Sunday) */}
            {activeSection === 'schedule' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <span>Daily Reminder Schedule</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Choose what time you want to be reminded and which days of the week are active.
                  </p>
                </div>

                {/* Reminder Time Picker */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Evening Reminder Time
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={preferences.reminderTime || '20:00'}
                      onChange={e => {
                        const val = e.target.value;
                        setPreferences(prev => ({ ...prev, reminderTime: val }));
                        savePreferences({ ...preferences, reminderTime: val });
                      }}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-bold"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Standard recommendation: 8:00 PM (giving you time to complete remaining goals before midnight)
                    </span>
                  </div>
                </div>

                {/* Active Reminder Days (Sunday first) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Active Days (Week Starting on Sunday)
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {WEEKDAYS.map(w => {
                      const selected = (preferences.reminderDays || [1, 2, 3, 4, 5]).includes(w.day);
                      return (
                        <button
                          key={w.day}
                          type="button"
                          onClick={() => toggleReminderDay(w.day)}
                          className={`py-3 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                            selected
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                              : 'bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <span>{w.label}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : 'bg-transparent'}`} />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                    Selected:{' '}
                    <strong className="text-gray-700 dark:text-gray-300">
                      {WEEKDAYS.filter(w => (preferences.reminderDays || [1, 2, 3, 4, 5]).includes(w.day)).map(w => w.full).join(', ')}
                    </strong>
                  </p>
                </div>

                {/* Smart Reminder Preview Card */}
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-500">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Smart Reminder Preview</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-200 font-semibold">
                    "Your streak is waiting! Complete today's priority plan to protect your momentum before midnight."
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Scheduled delivery: Daily at {preferences.reminderTime || '20:00'} on selected active days.
                  </p>
                </div>
              </div>
            )}

            {/* 4. QUIET HOURS */}
            {activeSection === 'quiethours' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Moon className="w-5 h-5 text-indigo-500" />
                    <span>Quiet Hours</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Define periods when notifications are completely muted so your sleep or focus time is never disturbed.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Enable Quiet Hours</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pause notifications during specified window</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('quietHoursEnabled')}
                    className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                      preferences.quietHoursEnabled !== false ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences.quietHoursEnabled !== false ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {preferences.quietHoursEnabled !== false && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-gray-200/60 dark:border-gray-800 space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Quiet Hours Start
                      </label>
                      <input
                        type="time"
                        value={preferences.quietHoursStart || '22:00'}
                        onChange={e => {
                          const val = e.target.value;
                          setPreferences(prev => ({ ...prev, quietHoursStart: val }));
                          savePreferences({ ...preferences, quietHoursStart: val });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono font-bold"
                      />
                      <span className="text-[11px] text-gray-400">Mutes starting at this time</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-gray-200/60 dark:border-gray-800 space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Quiet Hours End
                      </label>
                      <input
                        type="time"
                        value={preferences.quietHoursEnd || '07:00'}
                        onChange={e => {
                          const val = e.target.value;
                          setPreferences(prev => ({ ...prev, quietHoursEnd: val }));
                          savePreferences({ ...preferences, quietHoursEnd: val });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono font-bold"
                      />
                      <span className="text-[11px] text-gray-400">Resumes standard alerts</span>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-indigo-900 dark:text-indigo-300">
                  <p className="font-semibold mb-0.5">Good to know:</p>
                  Quiet hours only pause active alert notifications (emails and in-app sound/popups). Background platform synchronization and automatic verification continue seamlessly.
                </div>
              </div>
            )}

            {/* 5. AUTOMATION STATUS */}
            {activeSection === 'automation' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span>Automation & Service Health</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Live operational status of your background tracking, streak engine, and integration pipelines.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { title: 'Activity Tracking Service', desc: 'Automatic detection of commits and tasks', status: 'Active' },
                    { title: 'Platform Sync Engine', desc: 'GitHub, LeetCode, and developer APIs', status: 'Active' },
                    { title: 'Streak Calculation System', desc: 'Timezone-aware daily consecutive evaluator', status: 'Active' },
                    { title: 'Smart Notification Dispatcher', desc: 'Deduplicated reminders with quiet hour guards', status: 'Active' },
                  ].map(srv => (
                    <div key={srv.title} className="p-4 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-gray-200/60 dark:border-gray-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{srv.title}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {srv.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{srv.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Smart Reminder Intelligence Box */}
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Smart Reminder Intelligence</span>
                  </h4>
                  <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
                    Alumnex automatically avoids sending redundant reminders when all of your scheduled daily goals have already been completed or verified. Zero unnecessary spam.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15">✓ Goal-Aware</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15">✓ Timezone-Aware</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15">✓ Quiet-Hour-Aware</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/15">✓ Anti-Spam Cached</span>
                  </div>
                </div>

                {onOpenPlatforms && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={onOpenPlatforms}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-400"
                    >
                      <span>Manage Connected Platforms</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 6. DATA & PRIVACY (DANGER ZONE) */}
            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    <span>Data Privacy & Control</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    You own all your activity records. You can export your entire data history or permanently erase tracking data at any time.
                  </p>
                </div>

                {/* Export Data */}
                <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-gray-200/60 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Export Activity Data</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Download a JSON archive of all your activity records, goals, and history.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold transition-all shadow-sm flex-shrink-0"
                  >
                    <Download className="w-4 h-4 text-indigo-500" />
                    <span>Download JSON</span>
                  </button>
                </div>

                {/* Clear History Only */}
                <div className="p-4 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Clear Activity Records History</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Remove past activity records while preserving your configured goals and reminder preferences.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPrivacyModalType('clear-records')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear Records</span>
                  </button>
                </div>

                {/* Permanent Delete All */}
                <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/30 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Delete All Activity Data</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                        Permanently delete all activity history, records, streaks, and custom goals. This action cannot be reversed.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteInputText('');
                        setPrivacyModalType('delete-all');
                      }}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95"
                    >
                      Delete Everything Permanently
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TIMEZONE SELECTOR MODAL ── */}
      <AnimatePresence>
        {showTzModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Choose Your Local Timezone</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Search and select your standard IANA timezone</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTzModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tzSearch}
                    onChange={e => setTzSearch(e.target.value)}
                    placeholder="Search country, city, or timezone (e.g., India, London, New York)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                {filteredTimezones.map(t => {
                  const isCurrent = t.tz === activeTz;
                  return (
                    <button
                      key={t.tz}
                      type="button"
                      onClick={() => initiateTimezoneChange(t.tz)}
                      className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all ${
                        isCurrent
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/30'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{t.region}</span>
                          <span className="text-[11px] font-mono text-gray-400">{t.tz}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{t.label}</p>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TIMEZONE CHANGE WARNING MODAL ── */}
      <AnimatePresence>
        {showTzWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">Confirm Timezone Change</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Streak boundary adjustment notice</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Your activity day and streak calculations use your timezone. Changing from{' '}
                <strong className="text-gray-900 dark:text-white font-mono">{activeTz}</strong> to{' '}
                <strong className="text-indigo-500 font-mono">{pendingTz}</strong> may adjust how today's activities and streaks are grouped.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTzWarning(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmTimezoneChange}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Change Timezone
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PRIVACY CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {privacyModalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-500/30 overflow-hidden p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-500">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">
                    {privacyModalType === 'clear-records' ? 'Clear Activity Records?' : 'Delete All Activity Data?'}
                  </h4>
                  <p className="text-xs text-rose-500 font-semibold">This action cannot be undone</p>
                </div>
              </div>

              {privacyModalType === 'clear-records' ? (
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  This will remove all recorded daily activities and reset streak counters. Your goals and preferences will remain intact.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    This will permanently delete your goals, streak history, activity records, and notification preferences from the database.
                  </p>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                    Type <strong>DELETE</strong> below to confirm permanent deletion:
                  </div>
                  <input
                    type="text"
                    value={deleteInputText}
                    onChange={e => setDeleteInputText(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-900 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-rose-500 font-mono font-bold"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPrivacyModalType(null)}
                  disabled={isProcessingPrivacy}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={privacyModalType === 'clear-records' ? handleClearRecords : handleDeleteAll}
                  disabled={isProcessingPrivacy || (privacyModalType === 'delete-all' && deleteInputText.trim().toUpperCase() !== 'DELETE')}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  {isProcessingPrivacy ? 'Processing...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivitySettings;
