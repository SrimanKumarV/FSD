import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Flame, 
  Target, 
  UserCheck, 
  Briefcase, 
  MessageSquare, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

/**
 * NextBestAction Engine:
 * Lightweight deterministic rule-based prioritization based strictly on real user data.
 * Answers: "What should I pay attention to right now?"
 */
export const NextBestAction = ({ user, activity, recentActivities = [], upcomingEvents = [] }) => {
  const recommendations = useMemo(() => {
    const list = [];

    // Rule 1: Active Streak at Risk (Highest Urgency)
    const isStreakAtRisk = activity?.streakAtRisk || activity?.overallStreak?.isAtRisk;
    const currentStreak = activity?.overallStreak?.current || 0;
    if (isStreakAtRisk && currentStreak > 0) {
      list.push({
        id: 'streak_at_risk',
        priority: 100,
        type: 'urgent',
        icon: Flame,
        badge: 'Streak at Risk',
        title: `Protect your ${currentStreak}-day momentum streak`,
        description: 'You haven\'t verified an activity today. Complete a goal or sync your platforms before midnight to keep your streak intact.',
        actionLabel: 'Log Activity',
        actionUrl: '/activity',
        accentColor: 'rose'
      });
    }

    // Rule 2: Unfinished Daily Goals
    const todayGoals = activity?.todaysPlan?.goals || [];
    const pendingGoals = todayGoals.filter(g => !g.completed);
    if (pendingGoals.length > 0) {
      const firstPending = pendingGoals[0];
      list.push({
        id: 'unfinished_goal',
        priority: 85,
        type: 'action',
        icon: Target,
        badge: "Today's Target",
        title: `${pendingGoals.length} goal${pendingGoals.length > 1 ? 's' : ''} left today: ${firstPending.title || firstPending.name}`,
        description: `Remaining progress: ${firstPending.currentValue || 0}/${firstPending.targetValue || 1} ${firstPending.unit || 'units'}.`,
        actionLabel: 'View Today\'s Goals',
        actionUrl: '/activity',
        accentColor: 'amber'
      });
    }

    // Rule 3: Pending Network / Mentorship Review (Actionable Notifications)
    const pendingReviewItems = recentActivities.filter(a => a.status === 'pending' || a.status === 'unread');
    if (pendingReviewItems.length > 0) {
      list.push({
        id: 'pending_reviews',
        priority: 75,
        type: 'notice',
        icon: MessageSquare,
        badge: 'Pending Review',
        title: `You have ${pendingReviewItems.length} network item${pendingReviewItems.length > 1 ? 's' : ''} requiring your input`,
        description: pendingReviewItems[0]?.description || 'Check your notifications and pending requests to stay responsive.',
        actionLabel: 'Review Now',
        actionUrl: '/notifications',
        accentColor: 'blue'
      });
    }

    // Rule 4: Incomplete Profile / Matching Setup
    const hasBio = Boolean(user?.bio && user.bio.trim().length > 15);
    const hasSkills = Boolean(user?.skills && user.skills.length > 0);
    const hasAvatar = Boolean(user?.profilePicture || user?.avatar);
    if (!hasBio || !hasSkills || !hasAvatar) {
      list.push({
        id: 'profile_incomplete',
        priority: 60,
        type: 'improvement',
        icon: UserCheck,
        badge: 'Profile Strength',
        title: 'Complete your professional profile',
        description: 'Adding your core technical skills and bio improves mentor pairing and career recommendations by up to 80%.',
        actionLabel: 'Update Profile',
        actionUrl: '/profile',
        accentColor: 'indigo'
      });
    }

    // Rule 5: Role-specific Opportunities
    if (user?.role === 'student' && (!activity?.categoryStreaks?.career || activity.categoryStreaks.career.current === 0)) {
      list.push({
        id: 'student_career_step',
        priority: 50,
        type: 'growth',
        icon: Briefcase,
        badge: 'Career Growth',
        title: 'Explore vetted career openings & alumni mentors',
        description: 'Browse active job listings from verified alumni or schedule a mock interview.',
        actionLabel: 'Browse Jobs',
        actionUrl: '/jobs',
        accentColor: 'emerald'
      });
    }

    // Fallback Rule: Streak Continuation / Activity Hub Sync
    if (list.length === 0) {
      list.push({
        id: 'maintain_momentum',
        priority: 20,
        type: 'healthy',
        icon: Sparkles,
        badge: 'All Caught Up',
        title: 'All key tasks are up to date! Continue your momentum',
        description: 'Explore the Activity Hub or connect with peers across your college network.',
        actionLabel: 'Open Activity Hub',
        actionUrl: '/activity',
        accentColor: 'primary'
      });
    }

    return list.sort((a, b) => b.priority - a.priority);
  }, [user, activity, recentActivities, upcomingEvents]);

  // Display the top 1 or 2 highest-priority items
  const primaryAction = recommendations[0];
  if (!primaryAction) return null;

  const colorVariants = {
    rose: {
      border: 'border-rose-300/80 dark:border-rose-800/80',
      bg: 'bg-gradient-to-r from-rose-50/90 via-orange-50/70 to-rose-100/60 dark:from-rose-950/40 dark:via-gray-900/80 dark:to-rose-950/20',
      badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
      button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20',
      iconBox: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
    },
    amber: {
      border: 'border-amber-300/80 dark:border-amber-800/80',
      bg: 'bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-100/50 dark:from-amber-950/40 dark:via-gray-900/80 dark:to-amber-950/20',
      badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20',
      iconBox: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
    },
    blue: {
      border: 'border-blue-300/80 dark:border-blue-800/80',
      bg: 'bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-100/50 dark:from-blue-950/40 dark:via-gray-900/80 dark:to-blue-950/20',
      badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
      iconBox: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
    },
    indigo: {
      border: 'border-indigo-300/80 dark:border-indigo-800/80',
      bg: 'bg-gradient-to-r from-indigo-50/90 via-violet-50/60 to-indigo-100/50 dark:from-indigo-950/40 dark:via-gray-900/80 dark:to-indigo-950/20',
      badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
      button: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20',
      iconBox: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
    },
    emerald: {
      border: 'border-emerald-300/80 dark:border-emerald-800/80',
      bg: 'bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-100/50 dark:from-emerald-950/40 dark:via-gray-900/80 dark:to-emerald-950/20',
      badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
      iconBox: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
    },
    primary: {
      border: 'border-primary-300/80 dark:border-primary-800/80',
      bg: 'bg-gradient-to-r from-primary-50/90 via-indigo-50/60 to-primary-100/50 dark:from-primary-950/40 dark:via-gray-900/80 dark:to-primary-950/20',
      badge: 'bg-primary-100 dark:bg-primary-900/60 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800',
      button: 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20',
      iconBox: 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
    }
  };

  const currentTheme = colorVariants[primaryAction.accentColor] || colorVariants.primary;
  const ActionIcon = primaryAction.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative w-full rounded-2xl border ${currentTheme.border} ${currentTheme.bg} backdrop-blur-md p-5 sm:p-6 shadow-sm`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl flex-shrink-0 ${currentTheme.iconBox}`}>
            <ActionIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Next Best Action
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${currentTheme.badge}`}>
                {primaryAction.badge}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
              {primaryAction.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 max-w-2xl leading-relaxed">
              {primaryAction.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
          <Link
            to={primaryAction.actionUrl}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95 hover:no-underline ${currentTheme.button}`}
          >
            <span>{primaryAction.actionLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default NextBestAction;
