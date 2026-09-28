import React from 'react';
import { Video, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const CalendarEvent = ({ event, onClick, compact = false }) => {
  const getEventStyle = () => {
    switch (event.eventType) {
      case 'mentorship':
        return {
          bg: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60',
          border: 'border-l-purple-500 border-purple-200 dark:border-purple-800',
          text: 'text-purple-900 dark:text-purple-200',
          time: 'text-purple-600 dark:text-purple-400'
        };
      case 'alumnex_event':
        return {
          bg: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60',
          border: 'border-l-indigo-500 border-indigo-200 dark:border-indigo-800',
          text: 'text-indigo-900 dark:text-indigo-200',
          time: 'text-indigo-600 dark:text-indigo-400'
        };
      case 'career':
        return {
          bg: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60',
          border: 'border-l-emerald-500 border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-900 dark:text-emerald-200',
          time: 'text-emerald-600 dark:text-emerald-400'
        };
      case 'google':
      default:
        return {
          bg: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60',
          border: 'border-l-blue-500 border-blue-200 dark:border-blue-800',
          text: 'text-blue-900 dark:text-blue-200',
          time: 'text-blue-600 dark:text-blue-400'
        };
    }
  };

  const style = getEventStyle();
  const hasMeet = Boolean(event.conferenceData?.meetUrl || event.meetUrl);

  const formatTime = () => {
    if (event.allDay) return 'All day';
    try {
      return format(new Date(event.start), 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onClick(event)}
        className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-medium border-l-[3px] border transition-all truncate flex items-center justify-between gap-1 shadow-xs ${style.bg} ${style.border} ${style.text}`}
      >
        <div className="flex items-center gap-1 min-w-0">
          <span className="font-semibold flex-shrink-0 text-[10px] opacity-80">{formatTime()}</span>
          <span className="truncate">{event.summary || '(No title)'}</span>
        </div>
        {hasMeet && <Video className="w-3 h-3 flex-shrink-0 text-emerald-500" />}
      </button>
    );
  }

  return (
    <div
      onClick={() => onClick(event)}
      className={`w-full p-3 rounded-xl border border-l-4 transition-all cursor-pointer shadow-xs hover:shadow-sm ${style.bg} ${style.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className={`text-sm font-bold truncate ${style.text}`}>
            {event.summary || '(No title)'}
          </h4>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime()}</span>
            </span>
            {event.location && (
              <span className="flex items-center gap-1 truncate max-w-[180px]">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>
        </div>

        {hasMeet && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Video className="w-3 h-3" />
            <span>Meet</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default CalendarEvent;
