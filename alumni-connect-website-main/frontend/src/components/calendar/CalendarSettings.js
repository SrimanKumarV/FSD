import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Trash2, Calendar, Settings as SettingsIcon, AlertCircle, ExternalLink } from 'lucide-react';
import { useGoogleCalendars, useUpdateGoogleCalendarSettings, useDisconnectGoogleCalendar } from '../../hooks/useGoogleCalendar';
import toast from 'react-hot-toast';

export const CalendarSettings = ({
  isOpen,
  onClose,
  status
}) => {
  const { data: calendars = [], isLoading: loadingCalendars, error: calendarsError } = useGoogleCalendars(isOpen && Boolean(status?.connected));
  const updateSettingsMutation = useUpdateGoogleCalendarSettings();
  const disconnectMutation = useDisconnectGoogleCalendar();

  const [selectedIds, setSelectedIds] = useState([]);
  const [syncEnabled, setSyncEnabled] = useState(true);

  useEffect(() => {
    if (status) {
      if (status.selectedCalendarIds && status.selectedCalendarIds.length > 0) {
        setSelectedIds(status.selectedCalendarIds);
      } else if (calendars.length > 0) {
        setSelectedIds(calendars.map(c => c.id));
      } else if (status.primaryCalendarId) {
        setSelectedIds([status.primaryCalendarId]);
      }
      setSyncEnabled(status.syncEnabled !== false);
    }
  }, [status, calendars]);

  if (!isOpen) return null;

  const toggleCalendar = (id) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) {
        toast.error('At least one calendar must remain selected');
        return;
      }
      setSelectedIds(selectedIds.filter(cid => cid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = async () => {
    await updateSettingsMutation.mutateAsync({
      selectedCalendarIds: selectedIds,
      syncEnabled
    });
    onClose();
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect Google Calendar? Your synchronized events will be preserved or removed.')) {
      await disconnectMutation.mutateAsync();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Google Calendar Settings
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
            {/* Account Info */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Connected Account</span>
              <p className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5">
                {status?.googleAccountEmail || 'Connected Google Account'}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Connected & Authorized</span>
              </div>
            </div>

            {/* API Disabled / Sync Error Banner */}
            {(calendarsError || status?.lastError?.message?.includes('disabled') || status?.lastError?.message?.includes('not been used')) && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Google Calendar API Needs to be Enabled</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                      Google Calendar API has not been activated yet in Google Cloud project <strong>253683997850</strong>. Events cannot be fetched until you enable it.
                    </p>
                  </div>
                </div>
                <a
                  href="https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=253683997850"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95"
                >
                  <span>Enable Google Calendar API in Google Cloud</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Sync Switch */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Background Synchronization</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Keep events and schedule context up to date automatically.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncEnabled}
                  onChange={(e) => setSyncEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Calendars Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Calendars to Display</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select which calendars Alumnex should import and display.
                  </p>
                </div>
                {calendars.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedIds.length === calendars.length) {
                        const primary = calendars.find(c => c.primary)?.id || calendars[0]?.id;
                        setSelectedIds(primary ? [primary] : []);
                      } else {
                        setSelectedIds(calendars.map(c => c.id));
                      }
                    }}
                    className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    {selectedIds.length === calendars.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {loadingCalendars ? (
                <div className="py-6 text-center text-xs text-gray-400">Loading calendars...</div>
              ) : calendars.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-400">
                  Primary calendar is enabled by default.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {calendars.map((cal) => {
                    const isSelected = selectedIds.includes(cal.id);
                    return (
                      <div
                        key={cal.id}
                        onClick={() => toggleCalendar(cal.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary-50/70 border-primary-300 dark:bg-primary-950/40 dark:border-primary-800'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cal.backgroundColor || '#0284c7' }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {cal.summary}
                            </p>
                            {cal.primary && (
                              <span className="text-[10px] text-gray-400">Primary</span>
                            )}
                          </div>
                        </div>

                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Disconnect Action */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{disconnectMutation.isLoading ? 'Disconnecting...' : 'Disconnect Calendar'}</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updateSettingsMutation.isLoading}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all disabled:opacity-50"
            >
              {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CalendarSettings;
