import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this information. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
  minHeight = 'min-h-[280px]'
}) => {
  return (
    <div
      className={`w-full ${minHeight} flex flex-col items-center justify-center p-8 rounded-2xl bg-rose-50/30 dark:bg-rose-950/10 border border-rose-200/60 dark:border-rose-900/40 text-center ${className}`}
      role="alert"
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100/80 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
      </div>

      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-md mb-5 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
