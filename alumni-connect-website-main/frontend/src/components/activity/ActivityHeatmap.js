import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const ActivityHeatmap = ({ heatmapData }) => {
  const points = heatmapData?.points || [];
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Group points into 7-day columns (weeks) where Row 0 is Sunday, Row 6 is Saturday
  const weeks = useMemo(() => {
    if (!points || points.length === 0) return [];
    
    const result = [];
    let currentWeek = [];

    // Check day of week for the first point to align Sunday as row 0
    const firstDate = new Date(points[0].date);
    const startDayOfWeek = isNaN(firstDate.getTime()) ? 0 : firstDate.getDay(); // 0 is Sunday

    // Pad first week with nulls for days before start
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    points.forEach((pt) => {
      currentWeek.push(pt);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      result.push(currentWeek);
    }

    return result;
  }, [points]);

  const getColor = (count) => {
    if (!count || count === 0) return 'bg-gray-100 dark:bg-gray-800/80';
    if (count === 1) return 'bg-emerald-200 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800';
    if (count <= 3) return 'bg-emerald-400 dark:bg-emerald-700';
    if (count <= 5) return 'bg-emerald-500 dark:bg-emerald-600';
    return 'bg-emerald-600 dark:bg-emerald-400';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-800 space-y-4 min-w-0">
      {/* Header & Metrics */}
      <div className="flex items-center justify-between flex-wrap gap-3 min-w-0">
        <div className="min-w-0">
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Activity Calendar</h4>
          <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">
            {heatmapData?.activeDays || 0} active days in past year
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium shrink-0">
          <span>Less</span>
          <div className="flex items-center gap-1 shrink-0">
            <span className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800/80 shrink-0" />
            <span className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-950/60 shrink-0" />
            <span className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700 shrink-0" />
            <span className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-600 shrink-0" />
            <span className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-400 shrink-0" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Mobile Swipe Hint */}
      <div className="sm:hidden flex items-center justify-between text-[11px] text-gray-400 px-0.5">
        <span>↔ Swipe horizontally to explore full year</span>
        {hoveredPoint && (
          <button
            type="button"
            onClick={() => setHoveredPoint(null)}
            className="text-indigo-500 font-bold"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Grid Canvas with Sunday-first Day Labels (DevPulse responsive visualization scroll pattern) */}
      <div className="w-full overflow-x-auto touch-pan-x custom-scrollbar pb-2 relative">
        <div className="flex gap-2 min-w-[720px] justify-start py-2">
          {/* Day of Week Labels (Sunday first) */}
          <div className="flex flex-col gap-1.5 pt-0.5 pr-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 select-none">
            {dayLabels.map((lbl, idx) => (
              <span key={lbl} className="h-3.5 leading-[14px]">
                {idx % 2 === 0 ? lbl : ''}
              </span>
            ))}
          </div>

          {/* Week Columns */}
          <div className="flex gap-1.5 flex-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((day, dIdx) => (
                  day ? (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredPoint(day)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => setHoveredPoint(prev => prev?.date === day.date ? null : day)}
                      className={`w-3.5 h-3.5 rounded-sm transition-all cursor-pointer hover:scale-125 hover:z-20 ${getColor(day.count)} ${hoveredPoint?.date === day.date ? 'ring-2 ring-indigo-500 ring-offset-1 scale-125 z-20' : ''}`}
                    />
                  ) : (
                    <div key={`empty-${dIdx}`} className="w-3.5 h-3.5 rounded-sm opacity-0 pointer-events-none" />
                  )
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Active Tooltip Display */}
        {hoveredPoint && (
          <div className="mt-3 p-3 rounded-xl bg-gray-900 text-white text-xs shadow-xl flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="font-bold">{hoveredPoint.date}</span>: {hoveredPoint.count} verified activit{hoveredPoint.count === 1 ? 'y' : 'ies'}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-300">
              {hoveredPoint.categories?.coding > 0 && <span>💻 {hoveredPoint.categories.coding} coding</span>}
              {hoveredPoint.categories?.learning > 0 && <span>📚 {hoveredPoint.categories.learning} learning</span>}
              {hoveredPoint.categories?.project > 0 && <span>🌐 {hoveredPoint.categories.project} project</span>}
              {hoveredPoint.categories?.career > 0 && <span>💼 {hoveredPoint.categories.career} career</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityHeatmap;
