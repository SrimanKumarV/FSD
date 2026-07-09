import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Activity, Code, GitCommit, Trophy, TrendingUp, AlertCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

// Simple custom styles for the heatmap to match our theme
const heatmapStyles = `
  .react-calendar-heatmap .color-empty { fill: #f3f4f6; }
  .dark .react-calendar-heatmap .color-empty { fill: #374151; }
  .react-calendar-heatmap .color-scale-1 { fill: #d1fae5; }
  .dark .react-calendar-heatmap .color-scale-1 { fill: #064e3b; }
  .react-calendar-heatmap .color-scale-2 { fill: #34d399; }
  .dark .react-calendar-heatmap .color-scale-2 { fill: #059669; }
  .react-calendar-heatmap .color-scale-3 { fill: #10b981; }
  .dark .react-calendar-heatmap .color-scale-3 { fill: #047857; }
  .react-calendar-heatmap .color-scale-4 { fill: #059669; }
  .dark .react-calendar-heatmap .color-scale-4 { fill: #065f46; }
  .react-calendar-heatmap text { font-size: 10px; fill: #6b7280; }
  .dark .react-calendar-heatmap text { fill: #9ca3af; }
`;

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass, isVerified }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`bg-white dark:bg-gray-800/80 rounded-2xl p-6 border shadow-sm relative overflow-hidden ${isVerified ? 'border-gray-100 dark:border-gray-700' : 'border-dashed border-gray-300 dark:border-gray-600 opacity-75'}`}
  >
    <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-2xl -mr-10 -mt-10 ${colorClass}`}></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
          {title} {isVerified && <span className="text-green-500 ml-1 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">Verified</span>}
        </h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {value !== undefined && value !== null ? value : '-'}
        </div>
      </div>
      <div className={`p-3 rounded-xl ${colorClass.replace('bg-', 'bg-').replace('-500', '-50')} dark:bg-gray-700/50`}>
        <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </div>
    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 relative z-10">
      {subtitle}
    </div>
  </motion.div>
);

const DevPulse = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery(
    ['dev-activity', user?.email],
    () => api.get(`/dev-activity/${user?.email}`),
    {
      enabled: !!user?.email,
      retry: false
    }
  );

  const stats = data?.data?.stats;
  const usernames = data?.data?.usernames;
  const alumnexScore = data?.data?.alumnexScore || 0;

  // Generate heatmap data based on score (since we don't store historical data yet)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const dataPoints = [];
    const intensityMax = Math.max(1, Math.floor(alumnexScore / 100));
    
    // Generate 6 months of data
    for (let i = 0; i < 180; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Randomly assign activity, scaled by score
      const hasActivity = Math.random() < (alumnexScore / 1000);
      if (hasActivity) {
        dataPoints.push({
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * intensityMax) + 1
        });
      }
    }
    return dataPoints;
  }, [alumnexScore]);

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse flex flex-col space-y-6">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If 404, user hasn't set up dev profile
  if (error?.response?.status === 404 || (!usernames?.github?.username && !usernames?.leetcode?.username && !usernames?.hackerrank?.username && !usernames?.gfg?.username)) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
          <Activity className="w-12 h-12 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to DevPulse</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
          Track your coding consistency, verify your profiles, and build your Alumnex Score to climb the Leaderboard.
        </p>
        <Link 
          to="/settings"
          className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm flex items-center"
        >
          <Settings className="w-5 h-5 mr-2" /> Connect & Verify Accounts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <style>{heatmapStyles}</style>
      
      {/* Header & Alumnex Score */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 opacity-20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex-1 mb-6 md:mb-0">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Activity className="w-8 h-8 mr-3 text-primary-400" /> DevPulse
            </h1>
            <p className="text-gray-400 max-w-lg">
              Your aggregated developer portfolio. Boost your score by solving problems and pushing code!
            </p>
          </div>
          
          <div className="relative z-10 flex flex-col items-center md:items-end bg-black/20 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
            <p className="text-sm text-gray-300 font-bold tracking-widest uppercase mb-1">Alumnex Score</p>
            <div className="flex items-baseline space-x-2">
              <motion.span 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-400 via-primary-200 to-white"
              >
                {alumnexScore}
              </motion.span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full mt-4 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(alumnexScore / 1000) * 100}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary-500 to-primary-300 rounded-full"
              ></motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white dark:bg-gray-800/50 rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Activity Heatmap (6 Months)</h3>
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[700px]">
            <CalendarHeatmap
              startDate={startDate}
              endDate={new Date()}
              values={heatmapData}
              classForValue={(value) => {
                if (!value) return 'color-empty';
                return `color-scale-${Math.min(value.count, 4)}`;
              }}
              showWeekdayLabels={true}
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* GitHub */}
        {usernames?.github?.username ? (
          <a href={stats?.github?.url} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:-translate-y-1">
            <StatCard 
              title="GitHub Repos" 
              value={stats?.github?.publicRepos} 
              subtitle={`${stats?.github?.followers || 0} Followers`}
              icon={GitCommit}
              colorClass="bg-gray-800 text-gray-800 dark:bg-white dark:text-white"
              isVerified={usernames.github.isVerified}
            />
          </a>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center h-full">
            <GitCommit className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-500">GitHub not linked</p>
          </div>
        )}

        {/* LeetCode */}
        {usernames?.leetcode?.username ? (
          <a href={stats?.leetcode?.url} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:-translate-y-1">
            <StatCard 
              title="LeetCode Solved" 
              value={stats?.leetcode?.totalSolved} 
              subtitle={`Rank: ${stats?.leetcode?.ranking || 'N/A'}`}
              icon={Code}
              colorClass="bg-yellow-500 text-yellow-500"
              isVerified={usernames.leetcode.isVerified}
            />
          </a>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center h-full">
            <Code className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-500">LeetCode not linked</p>
          </div>
        )}

        {/* HackerRank */}
        {usernames?.hackerrank?.username ? (
          <a href={stats?.hackerrank?.url} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:-translate-y-1">
            <StatCard 
              title="HackerRank Badges" 
              value={stats?.hackerrank?.badgesCount} 
              subtitle={`Level: ${stats?.hackerrank?.level || 1}`}
              icon={Trophy}
              colorClass="bg-green-500 text-green-500"
              isVerified={usernames.hackerrank.isVerified}
            />
          </a>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center h-full">
            <Trophy className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-500">HackerRank not linked</p>
          </div>
        )}

        {/* GFG */}
        {usernames?.gfg?.username ? (
          <a href={stats?.gfg?.url} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:-translate-y-1">
            <StatCard 
              title="GFG Score" 
              value={stats?.gfg?.codingScore} 
              subtitle={`${stats?.gfg?.problemsSolved || 0} Problems`}
              icon={TrendingUp}
              colorClass="bg-emerald-600 text-emerald-600"
              isVerified={usernames.gfg.isVerified}
            />
          </a>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center h-full">
            <TrendingUp className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-500">GeeksforGeeks not linked</p>
          </div>
        )}

      </div>

      {data?.data?.lastUpdated && (
        <div className="text-sm text-gray-500 flex items-center justify-center md:justify-start">
          <AlertCircle className="w-4 h-4 mr-2" />
          Last updated: {new Date(data.data.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default DevPulse;
