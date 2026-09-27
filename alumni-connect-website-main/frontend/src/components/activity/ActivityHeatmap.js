import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ActivityHeatmap = ({ heatmapData }) => {
  const points = heatmapData?.points || [];
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Group points into 7-day columns (weeks)
  const weeks = [];
  let currentWeek = [];
  points.forEach((pt, index) => {
    currentWeek.push(pt);
    if (currentWeek.length === 7 || index === points.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getColor = (count) => {
    if (!count || count === 0) return 'bg-gray-100 dark:bg-gray-800/80';
    if (count === 1) return 'bg-emerald-200 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800';
    if (count <= 3) return 'bg-emerald-400 dark:bg-emerald-700';
    if (count <= 5) return 'bg-emerald-500 dark:bg-emerald-600';
    return 'bg-emerald-600 dark:bg-emerald-400';
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-4">
      {/* Header & Metrics */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Activity Calendar</h4>
          <p className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">
            {heatmapData?.activeDays || 0} active days in past year
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800/80" />
            <span className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-950/60" />
            <span className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
            <span className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
            <span className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-400" />
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Grid Canvas */}
      <div className="overflow-x-auto pb-2 relative">
        <div className="flex gap-1.5 min-w-[700px] justify-start py-2">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map(day => (
                <div
                  key={day.date}
                  onMouseEnter={() => setHoveredPoint(day)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className={`w-3.5 h-3.5 rounded-sm transition-all cursor-pointer hover:scale-125 hover:z-20 ${getColor(day.count)}`}
                />
              ))}
            </div>
          ))}
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
