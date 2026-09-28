import React from 'react';
import { 
  format, 
  isSameDay, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addDays, 
  isToday 
} from 'date-fns';
import CalendarGrid from './CalendarGrid';
import CalendarEvent from './CalendarEvent';
import { Clock, MapPin, Video, Calendar as CalendarIcon } from 'lucide-react';

export const CalendarView = ({
  view,
  currentDate,
  events = [],
  onSelectEvent,
  onSelectDay
}) => {
  // ─── 1. AGENDA VIEW (Mobile-friendly default) ───────────────────
  if (view === 'agenda') {
    // Group events by day
    const grouped = events.reduce((acc, evt) => {
      const dateKey = format(new Date(evt.start), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(evt);
      return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort();

    return (
      <div className="w-full space-y-4">
        {sortedDates.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <CalendarIcon className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
            <h4 className="font-bold text-gray-900 dark:text-white text-base">No Events Found</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              There are no events matching your current filters for this period.
            </p>
          </div>
        ) : (
          sortedDates.map((dateStr) => {
            const dayDate = new Date(`${dateStr}T12:00:00Z`);
            const isDayToday = isToday(dayDate);
            const dayEvents = grouped[dateStr];

            return (
              <div
                key={dateStr}
                className="w-full rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden"
              >
                {/* Day Header */}
                <div className={`px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between ${
                  isDayToday
                    ? 'bg-primary-50/70 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-bold'
                    : 'bg-gray-50/70 dark:bg-gray-800/40 text-gray-800 dark:text-gray-200 font-semibold'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm">
                      {format(dayDate, 'EEEE, MMMM d, yyyy')}
                    </span>
                    {isDayToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-600 text-white">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Events List */}
                <div className="p-3 sm:p-4 space-y-2">
                  {dayEvents.map((evt) => (
                    <CalendarEvent
                      key={evt._id || evt.googleEventId || evt.id}
                      event={evt}
                      onClick={onSelectEvent}
                      compact={false}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ─── 2. WEEK VIEW ──────────────────────────────────────────────
  if (view === 'week') {
    const weekStart = startOfWeek(currentDate);
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

    return (
      <div className="w-full rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden min-w-0">
        <div className="grid grid-cols-7 border-b border-gray-200/80 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60 text-center">
          {weekDays.map((d) => (
            <div
              key={d.toISOString()}
              onClick={() => onSelectDay(d)}
              className="py-2 px-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
            >
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
                {format(d, 'EEE')}
              </div>
              <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                isToday(d) ? 'bg-primary-600 text-white' : 'text-gray-900 dark:text-white'
              }`}>
                {format(d, 'd')}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[360px] divide-x divide-gray-100 dark:divide-gray-800">
          {weekDays.map((d) => {
            const dayEvents = events.filter(e => isSameDay(new Date(e.start), d));
            return (
              <div key={d.toISOString()} className="p-1.5 space-y-1.5 overflow-hidden">
                {dayEvents.map((evt) => (
                  <CalendarEvent
                    key={evt._id || evt.googleEventId || evt.id}
                    event={evt}
                    onClick={onSelectEvent}
                    compact={true}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── 3. DAY VIEW ───────────────────────────────────────────────
  if (view === 'day') {
    const dayEvents = events.filter(e => isSameDay(new Date(e.start), currentDate));

    return (
      <div className="w-full rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4 sm:p-6">
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3 mb-4 flex items-center justify-between">
          <h3 className="font-bold text-base text-gray-900 dark:text-white">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
          </span>
        </div>

        {dayEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No events scheduled for this day.
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((evt) => (
              <CalendarEvent
                key={evt._id || evt.googleEventId || evt.id}
                event={evt}
                onClick={onSelectEvent}
                compact={false}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── 4. DEFAULT: MONTH VIEW ────────────────────────────────────
  return (
    <CalendarGrid
      currentDate={currentDate}
      events={events}
      onSelectEvent={onSelectEvent}
      onSelectDay={onSelectDay}
    />
  );
};

export default CalendarView;
