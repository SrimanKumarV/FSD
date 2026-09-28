import React from 'react';

export const GoogleCalendarBadge = ({ source = 'google', eventType = 'google', size = 'sm' }) => {
  const getBadgeConfig = () => {
    if (source === 'google' || eventType === 'google') {
      return {
        label: 'Google Calendar',
        className: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        dotColor: 'bg-blue-500'
      };
    }
    if (eventType === 'mentorship') {
      return {
        label: '1:1 Mentorship',
        className: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        dotColor: 'bg-purple-500'
      };
    }
    if (eventType === 'alumnex_event') {
      return {
        label: 'Alumnex Event',
        className: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        dotColor: 'bg-indigo-500'
      };
    }
    if (eventType === 'career') {
      return {
        label: 'Career & Placement',
        className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        dotColor: 'bg-emerald-500'
      };
    }
    return {
      label: 'Scheduled',
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
      dotColor: 'bg-gray-400'
    };
  };

  const config = getBadgeConfig();
  const textClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${config.className} ${textClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      <span>{config.label}</span>
    </span>
  );
};

export default GoogleCalendarBadge;
