import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  LifeBuoy, 
  Search, 
  BookOpen, 
  MessageCircle, 
  Zap, 
  Flame, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

const HelpCentre = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const featuredTopics = [
    {
      title: 'Automated Platform Tracking',
      desc: 'Connect GitHub, LeetCode, and Codeforces to verify daily coding habits without manual check-ins.',
      category: 'Activity Hub',
      icon: Zap,
      color: 'text-amber-500 bg-amber-500/10',
      link: '/activity?tab=platforms'
    },
    {
      title: 'Streak Intelligence & Protection',
      desc: 'Understand how daily streak boundaries calculate and how streak-at-risk alerts protect your progress.',
      category: 'Streaks',
      icon: Flame,
      color: 'text-rose-500 bg-rose-500/10',
      link: '/activity?tab=streaks'
    },
    {
      title: 'Consistency Index Breakdown',
      desc: 'Learn how your 0–100 score is computed using active days (50%), goal execution (30%), and streak continuity (20%).',
      category: 'Analytics',
      icon: TrendingUp,
      color: 'text-indigo-500 bg-indigo-500/10',
      link: '/activity?tab=analytics'
    },
    {
      title: 'Quiet Hours & Timezone Setup',
      desc: 'Ensure your day resets match your local device time and pause notifications during sleep hours.',
      category: 'Settings',
      icon: Clock,
      color: 'text-emerald-500 bg-emerald-500/10',
      link: '/activity?tab=settings'
    }
  ];

  const mainCards = [
    {
      title: '⚡ Activity Hub & Streaks',
      desc: 'Build consistent learning habits, automate developer tracking, and review daily progress.',
      icon: Zap,
      color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      link: '/activity',
      badge: 'New Feature'
    },
    {
      title: 'Frequently Asked Questions',
      desc: 'Find quick, comprehensive answers about using Alumnex Connect, mentorship, jobs, and streaks.',
      icon: BookOpen,
      color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      link: '/faq'
    },
    {
      title: 'Contact Support',
      desc: "Can't find what you're looking for? Reach out to our friendly support and engineering team directly.",
      icon: MessageCircle,
      color: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      link: '/contact'
    }
  ];

  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return featuredTopics;
    const q = searchQuery.toLowerCase();
    return featuredTopics.filter(t => 
      t.title.toLowerCase().includes(q) || 
      t.desc.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }, [searchQuery, featuredTopics]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card bg-white/90 dark:bg-gray-800/90 rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-200/60 dark:border-gray-700/60"
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="p-3.5 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-4">
              <LifeBuoy className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
              How can we help you?
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl">
              Search our knowledge base, explore tutorials, or learn about automated activity tracking.
            </p>
            
            {/* Search Input */}
            <div className="mt-6 w-full max-w-xl relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm text-sm"
                placeholder="Search articles, guides, or features (e.g. streaks, quiet hours, leetcode)..."
              />
            </div>
          </div>

          {/* Primary Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {mainCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <Link 
                  key={idx}
                  to={card.link} 
                  className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all group bg-white dark:bg-gray-800/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-xl ${card.color} group-hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {card.badge && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:translate-x-1 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Featured Activity Intelligence Guides */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Featured Guides & Activity Hub Topics
                </h3>
              </div>
              <Link 
                to="/faq" 
                className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
              >
                View all FAQs →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredTopics.map((topic, i) => {
                const Icon = topic.icon;
                return (
                  <Link
                    key={i}
                    to={topic.link}
                    className="p-4 rounded-xl border border-gray-200/80 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-gray-100/80 dark:hover:bg-gray-800 transition-colors block group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${topic.color} flex-shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {topic.title}
                          </h4>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase flex-shrink-0">
                            {topic.category}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                          {topic.desc}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpCentre;
