import React from 'react';
import { isToday, isSameMonth, format } from 'date-fns';
import CalendarEvent from './CalendarEvent';

export const CalendarDay = ({
  day,
  currentMonth,
  events = [],
  onSelectEvent,
  onSelectDay
}) => {
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isDayToday = isToday(day);

  // Maximum events to display directly before showing +N more
  const MAX_EVENTS = 3;
  const visibleEvents = events.slice(0, MAX_EVENTS);
  const hiddenCount = events.length - MAX_EVENTS;

  return (
    <div
      onClick={() => onSelectDay(day)}
      className={`min-h-[100px] sm:min-h-[115px] p-1.5 sm:p-2 border-b border-r border-gray-200/60 dark:border-gray-800/80 flex flex-col justify-between transition-colors cursor-pointer group ${
        isCurrentMonth 
          ? 'bg-white dark:bg-gray-900/60 hover:bg-gray-50/70 dark:hover:bg-gray-800/40' 
          : 'bg-gray-50/60 dark:bg-gray-950/40 opacity-50'
      }`}
    >
      {/* Day Number Header */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${
            isDayToday
              ? 'bg-primary-600 text-white font-bold shadow-xs'
              : isCurrentMonth
              ? 'text-gray-900 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400'
              : 'text-gray-400 dark:text-gray-600'
          }`}
        >
          {format(day, 'd')}
        </span>

        {events.length > 0 && (
          <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-primary-500" />
        )}
      </div>

      {/* Events Container */}
      <div className="flex-1 space-y-1 overflow-hidden min-h-0">
        {visibleEvents.map((evt) => (
          <CalendarEvent
            key={evt._id || evt.googleEventId || evt.id}
            event={evt}
            onClick={onSelectEvent}
            compact={true}
          />
        ))}

        {hiddenCount > 0 && (
          <button
            type="button"
            className="w-full text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 pl-1"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </div>
  );
};

export default CalendarDay;
