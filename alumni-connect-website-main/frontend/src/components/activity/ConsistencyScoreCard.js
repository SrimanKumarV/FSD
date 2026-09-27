import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Info } from 'lucide-react';

const ConsistencyScoreCard = ({ consistencyData }) => {
  const score = consistencyData?.score ?? 0;
  const grade = consistencyData?.grade ?? 'Starting';
  const breakdown = consistencyData?.breakdown || [];

  return (
    <div className="glass-card rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Consistency Index</h4>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          {grade}
        </span>
      </div>

      <div className="flex items-center gap-6 pt-1">
        {/* Score Number Display */}
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-4 border-indigo-500/30 flex-shrink-0">
          <div className="text-center">
            <span className="text-3xl font-black text-gray-900 dark:text-white">{score}</span>
            <span className="text-[10px] block text-gray-400 font-bold uppercase tracking-widest mt-[-2px]">%</span>
          </div>
        </div>

        {/* Factors Breakdown */}
        <div className="flex-1 space-y-2.5">
          {breakdown.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                <span className="font-bold text-gray-900 dark:text-white">{item.points}/{item.max} pts</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.points / item.max) * 100}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="h-full bg-indigo-500 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1.5 pt-1">
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Calculated from active days (50%), goal completions (30%), and streak length (20%).</span>
      </p>
    </div>
  );
};

export default ConsistencyScoreCard;
