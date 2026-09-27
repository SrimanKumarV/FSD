import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, CheckCircle2, Trophy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const typeConfig = {
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
    titleColor: 'text-amber-900 dark:text-amber-300'
  },
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
    titleColor: 'text-emerald-900 dark:text-emerald-300'
  },
  milestone: {
    icon: Trophy,
    bgColor: 'bg-purple-500/10 border-purple-500/20 text-purple-500',
    titleColor: 'text-purple-900 dark:text-purple-300'
  },
  highlight: {
    icon: Lightbulb,
    bgColor: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500',
    titleColor: 'text-indigo-900 dark:text-indigo-300'
  },
  info: {
    icon: Lightbulb,
    bgColor: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    titleColor: 'text-blue-900 dark:text-blue-300'
  }
};

const ActivityInsight = ({ insights = [], isCompact = false }) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-3">
        <Lightbulb className="w-5 h-5 text-indigo-500 flex-shrink-0" />
        <p className="text-xs text-indigo-900 dark:text-indigo-300 font-medium">
          Keep logging your daily goals and activities to unlock personalized behavioral insights!
        </p>
      </div>
    );
  }

  const displayInsights = isCompact ? insights.slice(0, 1) : insights;

  return (
    <div className="space-y-2.5">
      {displayInsights.map((insight, idx) => {
        const config = typeConfig[insight.type] || typeConfig.info;
        const Icon = config.icon;

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border flex items-start justify-between gap-3 glass-card"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl border ${config.bgColor} flex-shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h5 className={`text-sm font-bold ${config.titleColor}`}>
                  {insight.title}
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>

            {insight.actionUrl && (
              <Link
                to={insight.actionUrl}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 flex-shrink-0 pt-1"
              >
                <span>Action</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActivityInsight;
