import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, Video, Plus, Sparkles, MapPin } from 'lucide-react';
import { useGoogleScheduleContext, useGoogleCalendarStatus } from '../../hooks/useGoogleCalendar';
import { format } from 'date-fns';

export const TodayScheduleWidget = () => {
  const { data: status } = useGoogleCalendarStatus();
  const isConnected = Boolean(status?.connected);
  const { data: schedule, isLoading } = useGoogleScheduleContext();

  const events = schedule?.events || [];
  const freeWindows = schedule?.freeWindows || [];
  const nextEvent = schedule?.nextEvent;

  // Filter for events today
  const todayEvents = events.slice(0, 4);

  const formatEventTime = (dateVal, allDay) => {
    if (allDay) return 'All day';
    try {
      return format(new Date(dateVal), 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="w-full rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Schedule Context
              </span>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                Today's Schedule
              </h3>
            </div>
          </div>

          <Link
            to="/calendar"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
          >
            <span>View Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Schedule Content */}
        {!isConnected ? (
          <div className="p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700 text-center space-y-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              Connect Google Calendar to see your classes, meetings, and mentorship sessions here.
            </p>
            <Link
              to="/calendar"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
            >
              <span>Connect Calendar</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : isLoading ? (
          <div className="py-6 text-center text-xs text-gray-400">Loading schedule...</div>
        ) : todayEvents.length === 0 ? (
          <div className="py-5 text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl">
            <p className="font-medium text-gray-700 dark:text-gray-300">Your day is open!</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              No meetings scheduled. Perfect focus time for your active goals.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((evt) => {
              const hasMeet = Boolean(evt.meetUrl);
              return (
                <div
                  key={evt.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 bg-gray-50/60 dark:bg-gray-800/30 transition-all text-xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-bold text-gray-500 dark:text-gray-400 text-[11px] whitespace-nowrap min-w-[58px]">
                      {formatEventTime(evt.start, evt.allDay)}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {evt.title || '(No title)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {hasMeet && (
                      <span className="p-1 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" title="Google Meet attached">
                        <Video className="w-3 h-3" />
                      </span>
                    )}
                    {evt.source === 'mentorship' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        1:1
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Free Window Highlight */}
      {isConnected && freeWindows.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Next free window: <strong className="text-gray-800 dark:text-gray-200">{freeWindows[0].durationMinutes} mins</strong></span>
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Available</span>
        </div>
      )}
    </div>
  );
};

export default TodayScheduleWidget;
