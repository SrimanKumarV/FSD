import React from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay 
} from 'date-fns';
import CalendarDay from './CalendarDay';

export const CalendarGrid = ({
  currentDate,
  events = [],
  onSelectEvent,
  onSelectDay
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full min-w-0 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      {/* Weekday Header Row */}
      <div className="grid grid-cols-7 border-b border-gray-200/80 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/60 text-center">
        {weekDays.map((wd) => (
          <div
            key={wd}
            className="py-2.5 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid (7 columns) */}
      <div className="grid grid-cols-7 border-l border-t border-gray-200/60 dark:border-gray-800/80">
        {days.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.start), day));
          return (
            <CalendarDay
              key={day.toISOString()}
              day={day}
              currentMonth={monthStart}
              events={dayEvents}
              onSelectEvent={onSelectEvent}
              onSelectDay={onSelectDay}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CalendarGrid;
