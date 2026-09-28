import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  RefreshCw, 
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export const CalendarHeader = ({
  currentDate,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  onCreateEvent,
  onOpenSettings,
  onSync,
  isSyncing,
  isConnected,
  status
}) => {
  const views = [
    { id: 'month', label: 'Month' },
    { id: 'week', label: 'Week' },
    { id: 'day', label: 'Day' },
    { id: 'agenda', label: 'Agenda' }
  ];

  return (
    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200/70 dark:border-gray-800">
      {/* Left: Date navigation */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPrevious}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors shadow-sm"
            aria-label="Previous period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToday}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors shadow-sm"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onNext}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/80 transition-colors shadow-sm"
            aria-label="Next period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          {view === 'day' 
            ? format(currentDate, 'EEEE, MMMM d, yyyy')
            : format(currentDate, 'MMMM yyyy')}
        </h1>

        {isConnected && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Synced</span>
          </span>
        )}
      </div>

      {/* Right: View switcher & Actions */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* View Mode Switcher */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200/60 dark:border-gray-700/60">
          {views.map((v) => {
            const isActive = view === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onViewChange(v.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        {/* Sync Now Button */}
        {isConnected && (
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50"
            title="Sync with Google Calendar"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-primary-500' : ''}`} />
          </button>
        )}

        {/* Settings button */}
        {isConnected && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            title="Calendar Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        )}

        {/* Create Event Button */}
        <button
          type="button"
          onClick={onCreateEvent}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-primary-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;
