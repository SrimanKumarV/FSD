import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  Trash2, 
  Settings as SettingsIcon, 
  Check, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { 
  useGoogleCalendarStatus, 
  useGoogleCalendars, 
  useGoogleCalendarSync, 
  useUpdateGoogleCalendarSettings, 
  useDisconnectGoogleCalendar 
} from '../../hooks/useGoogleCalendar';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';

export const GoogleCalendarSettingsCard = () => {
  const { data: status, isLoading: loadingStatus, refetch: refetchStatus } = useGoogleCalendarStatus();
  const syncMutation = useGoogleCalendarSync();
  const disconnectMutation = useDisconnectGoogleCalendar();
  const updateSettingsMutation = useUpdateGoogleCalendarSettings();

  const [connecting, setConnecting] = useState(false);
  const [showCalendarSelector, setShowCalendarSelector] = useState(false);

  const isConnected = Boolean(status?.connected);
  const isReauth = status?.status === 'reauthorization_required';

  const { data: calendars = [], isLoading: loadingCalendars } = useGoogleCalendars(showCalendarSelector && isConnected);
  const [selectedIds, setSelectedIds] = useState([]);

  React.useEffect(() => {
    if (status?.selectedCalendarIds && status.selectedCalendarIds.length > 0) {
      setSelectedIds(status.selectedCalendarIds);
    } else if (calendars.length > 0) {
      setSelectedIds(calendars.map(c => c.id));
    } else if (status?.primaryCalendarId) {
      setSelectedIds([status.primaryCalendarId]);
    }
  }, [status, calendars]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const isMobile = Capacitor.isNativePlatform();
      const res = await api.get('/google-calendar/connect', {
        params: {
          mode: isMobile ? 'mobile' : 'web',
          frontendUrl: typeof window !== 'undefined' ? window.location.origin : undefined
        }
      });

      const authUrl = res.data?.authorizationUrl || res.authorizationUrl;
      if (!authUrl) throw new Error('No authorization URL received');

      if (isMobile) {
        await Browser.open({ url: authUrl, windowName: '_system' });
      } else {
        window.location.href = authUrl;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to start authorization');
      setConnecting(false);
    }
  };

  const handleToggleCalendar = async (calId) => {
    let updated;
    if (selectedIds.includes(calId)) {
      if (selectedIds.length === 1) {
        toast.error('At least one calendar must be selected');
        return;
      }
      updated = selectedIds.filter(id => id !== calId);
    } else {
      updated = [...selectedIds, calId];
    }
    setSelectedIds(updated);
    await updateSettingsMutation.mutateAsync({ selectedCalendarIds: updated });
  };

  const handleToggleSync = async (enabled) => {
    await updateSettingsMutation.mutateAsync({ syncEnabled: enabled });
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect Google Calendar?')) {
      await disconnectMutation.mutateAsync();
    }
  };

  const formatLastSynced = () => {
    if (!status?.lastSyncedAt) return 'Never';
    try {
      return formatDistanceToNow(new Date(status.lastSyncedAt), { addSuffix: true });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-primary-500" />
          Google Calendar Integration
        </h3>
        {isConnected && !isReauth && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Connected</span>
          </span>
        )}
      </div>

      <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-sm space-y-4">
        {!isConnected || isReauth ? (
          /* Disconnected / Reauth View */
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-base">
                {isReauth ? 'Authorization Expired' : 'Google Calendar Not Connected'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                {isReauth
                  ? 'Your Google authorization expired or was revoked. Reconnect your account to resume synchronization.'
                  : 'Connect your Google account to automatically sync Alumnex workshops, campus events, and 1:1 mentorship sessions with Google Meet.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all whitespace-nowrap active:scale-95 disabled:opacity-50 ${
                isReauth
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                  : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20'
              }`}
            >
              {connecting ? 'Connecting...' : isReauth ? 'Reconnect Google Calendar' : 'Connect Google Calendar'}
            </button>
          </div>
        ) : (
          /* Connected View */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="text-gray-400 uppercase font-bold text-[10px]">Google Account</span>
                <p className="font-semibold text-gray-900 dark:text-white truncate mt-0.5">
                  {status?.googleAccountEmail || 'Connected'}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="text-gray-400 uppercase font-bold text-[10px]">Primary Calendar</span>
                <p className="font-semibold text-gray-900 dark:text-white truncate mt-0.5">
                  {status?.primaryCalendarId === 'primary' ? 'Personal Calendar' : (status?.primaryCalendarId || 'Personal')}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="text-gray-400 uppercase font-bold text-[10px]">Sync Status</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${status?.syncEnabled !== false ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  <span>{status?.syncEnabled !== false ? 'Enabled' : 'Paused'}</span>
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <span className="text-gray-400 uppercase font-bold text-[10px]">Last Synchronized</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                  {formatLastSynced()}
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isLoading ? 'animate-spin text-primary-500' : ''}`} />
                  <span>{syncMutation.isLoading ? 'Syncing...' : 'Sync Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCalendarSelector(!showCalendarSelector)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span>{showCalendarSelector ? 'Hide Calendars' : 'Choose Calendars'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{disconnectMutation.isLoading ? 'Disconnecting...' : 'Disconnect'}</span>
              </button>
            </div>

            {/* Expandable Calendar Selector */}
            {showCalendarSelector && (
              <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-xs text-gray-900 dark:text-white">
                    Select Calendars to Import & Display:
                  </p>
                  {calendars.length > 1 && (
                    <button
                      type="button"
                      onClick={async () => {
                        let newIds;
                        if (selectedIds.length === calendars.length) {
                          const primary = calendars.find(c => c.primary)?.id || calendars[0]?.id;
                          newIds = primary ? [primary] : [];
                        } else {
                          newIds = calendars.map(c => c.id);
                        }
                        setSelectedIds(newIds);
                        await updateSettingsMutation.mutateAsync({ selectedCalendarIds: newIds });
                      }}
                      className="text-[11px] font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors cursor-pointer"
                    >
                      {selectedIds.length === calendars.length ? 'Deselect All' : 'Select All'}
                    </button>
                  )}
                </div>

                {loadingCalendars ? (
                  <p className="text-xs text-gray-400">Loading calendars...</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {calendars.map((cal) => {
                      const isSelected = selectedIds.includes(cal.id);
                      return (
                        <div
                          key={cal.id}
                          onClick={() => handleToggleCalendar(cal.id)}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary-50/70 border-primary-300 dark:bg-primary-950/40 dark:border-primary-800'
                              : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cal.backgroundColor || '#0284c7' }}
                            />
                            <span className="font-medium text-gray-900 dark:text-white truncate">
                              {cal.summary}
                            </span>
                            {cal.primary && (
                              <span className="text-[10px] text-gray-400 font-normal">Primary</span>
                            )}
                          </div>
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-400'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarSettingsCard;
