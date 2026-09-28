import React from 'react';
import { Calendar, Clock, MapPin, Video, ArrowRight } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import GoogleCalendarBadge from './GoogleCalendarBadge';

export const UpcomingEvents = ({
  events = [],
  onSelectEvent,
  maxItems = 5
}) => {
  const now = new Date();
  const upcoming = events
    .filter(e => new Date(e.end || e.start) >= now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, maxItems);

  const formatEventDate = (dateVal) => {
    try {
      const d = new Date(dateVal);
      if (isToday(d)) return 'Today';
      if (isTomorrow(d)) return 'Tomorrow';
      return format(d, 'EEE, MMM d');
    } catch (e) {
      return '';
    }
  };

  const formatEventTime = (dateVal) => {
    try {
      return format(new Date(dateVal), 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="w-full rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
            Upcoming Schedule
          </h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          {upcoming.length} events
        </span>
      </div>

      {upcoming.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
          No upcoming events scheduled.
        </div>
      ) : (
        <div className="space-y-2.5">
          {upcoming.map((evt) => {
            const hasMeet = Boolean(evt.conferenceData?.meetUrl || evt.meetUrl);
            return (
              <div
                key={evt._id || evt.googleEventId || evt.id}
                onClick={() => onSelectEvent(evt)}
                className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 bg-gray-50/60 dark:bg-gray-800/40 hover:bg-primary-50/20 dark:hover:bg-primary-950/20 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary-600 dark:text-primary-400 mb-0.5">
                      <span>{formatEventDate(evt.start)}</span>
                      <span>•</span>
                      <span>{evt.allDay ? 'All Day' : formatEventTime(evt.start)}</span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {evt.summary || '(No title)'}
                    </h4>

                    {evt.location && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    )}
                  </div>

                  {hasMeet && (
                    <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex-shrink-0" title="Google Meet attached">
                      <Video className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents;
