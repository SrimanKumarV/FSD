import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({
  message = 'Loading data...',
  description,
  className = '',
  minHeight = 'min-h-[280px]'
}) => {
  return (
    <div
      className={`w-full ${minHeight} flex flex-col items-center justify-center p-8 rounded-2xl bg-white/40 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-800/50 backdrop-blur-sm text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-850 flex items-center justify-center mb-4">
        <Loader2 className="w-6 h-6 text-primary-600 dark:text-primary-400 animate-spin" />
      </div>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
        {message}
      </p>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1">
          {description}
        </p>
      )}
    </div>
  );
};

export default LoadingState;
