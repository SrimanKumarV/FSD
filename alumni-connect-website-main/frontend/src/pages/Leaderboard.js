import React from 'react';
import { useQuery } from 'react-query';
import { Trophy, Medal, Search, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const Leaderboard = () => {
  const { user } = useAuth();
  
  const { data, isLoading, error } = useQuery(
    'leaderboard',
    () => api.get('/leaderboard')
  );

  const leaderboardData = data?.data?.leaderboard || [];

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 font-bold border border-yellow-200 dark:border-yellow-700">
            <Trophy className="w-4 h-4" />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold border border-gray-200 dark:border-gray-700">
            <Medal className="w-4 h-4" />
          </div>
        );
      case 3:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-500 font-bold border border-orange-200 dark:border-orange-700">
            <Medal className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 font-semibold text-sm">
            #{rank}
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-3xl w-full"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-alumni-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex items-center mb-6 md:mb-0">
          <div className="p-4 bg-white/20 rounded-2xl mr-6 backdrop-blur-sm border border-white/30">
            <Trophy className="w-10 h-10 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Global Leaderboard</h1>
            <p className="text-primary-100 max-w-lg text-lg">
              The top developers from Kongu Engineering College. Connect your DevPulse profile to climb the ranks!
            </p>
          </div>
        </div>
        <div className="relative z-10">
          <Link 
            to="/devpulse"
            className="px-6 py-3 bg-white text-primary-600 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center"
          >
            <Activity className="w-5 h-5 mr-2" /> View My DevPulse
          </Link>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Developer</th>
                <th className="px-6 py-4">Department & Batch</th>
                <th className="px-6 py-4">Verified Platforms</th>
                <th className="px-6 py-4 text-right">Alumnex Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {leaderboardData.length > 0 ? (
                leaderboardData.map((profile, index) => {
                  const isCurrentUser = profile.name === user?.name;
                  
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={profile.name + index} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isCurrentUser ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRankBadge(profile.rank)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-alumni-500 flex items-center justify-center text-white font-medium shadow-sm">
                            {profile.photo ? (
                              <img src={profile.photo} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              profile.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="font-bold text-gray-900 dark:text-white flex items-center">
                              {profile.name}
                              {isCurrentUser && (
                                <span className="ml-2 text-[10px] uppercase tracking-wider bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded border border-primary-200 dark:border-primary-800">You</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                              {profile.usernames?.github?.username && <span>GH: {profile.stats?.github}</span>}
                              {profile.usernames?.leetcode?.username && <span>LC: {profile.stats?.leetcode}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-300 font-medium">{profile.department || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{profile.batch || 'Alumni'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {profile.usernames?.github?.isVerified && <div title="Verified GitHub" className="w-2 h-2 rounded-full bg-green-500"></div>}
                          {profile.usernames?.leetcode?.isVerified && <div title="Verified LeetCode" className="w-2 h-2 rounded-full bg-yellow-500"></div>}
                          {profile.usernames?.hackerrank?.isVerified && <div title="Verified HackerRank" className="w-2 h-2 rounded-full bg-blue-500"></div>}
                          {profile.usernames?.gfg?.isVerified && <div title="Verified GFG" className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-600 to-alumni-600 dark:from-primary-400 dark:to-alumni-400">
                          {profile.alumnexScore}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Trophy className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white">No developers ranked yet</p>
                    <p className="mt-1">Connect your DevPulse accounts in Settings to appear on the leaderboard!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
