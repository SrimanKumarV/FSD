import React from 'react';
import { Search, Filter, Calendar, Users, Briefcase, Globe } from 'lucide-react';

export const CalendarToolbar = ({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  eventCount = 0
}) => {
  const filters = [
    { id: 'all', label: 'All Events', icon: Globe },
    { id: 'google', label: 'Google Calendar', icon: Calendar },
    { id: 'alumnex_event', label: 'Alumnex Events', icon: Calendar },
    { id: 'mentorship', label: 'Mentorship', icon: Users },
    { id: 'career', label: 'Career', icon: Briefcase }
  ];

  return (
    <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search calendar events, meetings, or locations..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
        />
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {filters.map((f) => {
          const isActive = activeFilter === f.id;
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/20'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/70 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarToolbar;
