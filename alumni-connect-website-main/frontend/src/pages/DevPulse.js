import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Activity, Code, GitCommit, Trophy, TrendingUp, AlertCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white dark:bg-gray-800/80 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-2xl -mr-10 -mt-10 ${colorClass}`}></div>
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
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

  // Calculate a mock "Consistency Score" based on stats
  const consistencyScore = useMemo(() => {
    if (!stats) return 0;
    let score = 0;
    if (stats.github?.publicRepos > 10) score += 25;
    else if (stats.github?.publicRepos > 0) score += 10;
    
    if (stats.leetcode?.totalSolved > 100) score += 25;
    else if (stats.leetcode?.totalSolved > 10) score += 10;
    
    if (stats.hackerrank?.badgesCount > 5) score += 25;
    else if (stats.hackerrank?.badgesCount > 0) score += 10;
    
    if (stats.gfg?.codingScore > 50) score += 25;
    else if (stats.gfg?.codingScore > 10) score += 10;
    
    return Math.min(score + 10, 100); // base 10 points for setting it up
  }, [stats]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse flex flex-col space-y-6">
          <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
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
  if (error?.response?.status === 404 || (!usernames?.github && !usernames?.leetcode && !usernames?.hackerrank && !usernames?.gfg)) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
          <Activity className="w-12 h-12 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to DevPulse</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl">
          Track your coding consistency across GitHub, LeetCode, HackerRank, and GeeksforGeeks all in one place.
        </p>
        <Link 
          to="/settings"
          className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm flex items-center"
        >
          <Settings className="w-5 h-5 mr-2" /> Connect Your Accounts
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Consistency Score */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500 opacity-20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Activity className="w-8 h-8 mr-3 text-primary-400" /> DevPulse
            </h1>
            <p className="text-gray-400 mb-8 max-w-lg">
              Your aggregated developer activity dashboard. Stay consistent and keep building!
            </p>
            
            <div className="flex items-end space-x-6">
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Consistency Score</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-200">
                    {consistencyScore}
                  </span>
                  <span className="text-gray-500 font-medium">/ 100</span>
                </div>
              </div>
              <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${consistencyScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-300 rounded-full"
                ></motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* GitHub */}
        {usernames?.github ? (
          <a href={stats?.github?.url} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:-translate-y-1">
            <StatCard 
              title="GitHub Repos" 
              value={stats?.github?.publicRepos} 
              subtitle={`${stats?.github?.followers || 0} Followers`}
              icon={GitCommit}
              colorClass="bg-gray-800 text-gray-800 dark:bg-white dark:text-white"
            />
          </a>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center h-full">
            <GitCommit className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-500">GitHub not linked</p>
          </div>
        )}

        {/* LeetCode */}
        {usernames?.leetcode ? (
          <a href={stats?.leetcode?.url} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:-translate-y-1">
            <StatCard 
              title="LeetCode Solved" 
              value={stats?.leetcode?.totalSolved} 
              subtitle={`Rank: ${stats?.leetcode?.ranking || 'N/A'}`}
              icon={Code}
              colorClass="bg-yellow-500 text-yellow-500"
            />
          </a>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center h-full">
            <Code className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-500">LeetCode not linked</p>
          </div>
        )}

        {/* HackerRank */}
        {usernames?.hackerrank ? (
          <a href={stats?.hackerrank?.url} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:-translate-y-1">
            <StatCard 
              title="HackerRank Badges" 
              value={stats?.hackerrank?.badgesCount} 
              subtitle={`Level: ${stats?.hackerrank?.level || 1}`}
              icon={Trophy}
              colorClass="bg-green-500 text-green-500"
            />
          </a>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center h-full">
            <Trophy className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-500">HackerRank not linked</p>
          </div>
        )}

        {/* GFG */}
        {usernames?.gfg ? (
          <a href={stats?.gfg?.url} target="_blank" rel="noopener noreferrer" className="block transition-transform hover:-translate-y-1">
            <StatCard 
              title="GFG Score" 
              value={stats?.gfg?.codingScore} 
              subtitle={`${stats?.gfg?.problemsSolved || 0} Problems`}
              icon={TrendingUp}
              colorClass="bg-emerald-600 text-emerald-600"
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
