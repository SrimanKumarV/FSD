import React from 'react';
import { Card, CardHeader, CardTitle, CardBody } from './Card';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import { BarChart3 } from 'lucide-react';

export const ChartContainer = ({
  title,
  subtitle,
  action,
  children,
  loading = false,
  empty = false,
  emptyTitle = 'No activity recorded yet',
  emptyDescription = 'Complete activities or sync your platforms to view trends.',
  height = 'h-64 sm:h-72',
  className = ''
}) => {
  return (
    <Card className={`w-full overflow-hidden ${className}`}>
      {(title || action) && (
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            {title && <CardTitle className="text-base sm:text-lg">{title}</CardTitle>}
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
        </CardHeader>
      )}

      <CardBody className="pt-2">
        {loading ? (
          <div className={`${height} flex items-center justify-center`}>
            <LoadingState minHeight="min-h-full" message="Rendering chart data..." />
          </div>
        ) : empty ? (
          <div className={`${height} flex items-center justify-center`}>
            <EmptyState
              icon={BarChart3}
              title={emptyTitle}
              description={emptyDescription}
              className="border-none bg-transparent min-h-0 py-6"
            />
          </div>
        ) : (
          <div className={`w-full ${height} min-w-0`}>
            {children}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default ChartContainer;
