import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Trophy, Medal, Star, Award, Users, Building2,
  ChevronDown, Search, Loader2, TrendingUp, Briefcase, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';

const POINT_BREAKDOWN_LABELS = {
  acceptedRequests: { label: 'Requests Accepted', pts: '+5 pts each', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  completedMentorships: { label: 'Completed Mentorships', pts: '+20 pts each', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  feedbackPoints: { label: 'Feedback Points', pts: 'based on stars', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
  sessionPoints: { label: 'Session Points', pts: '+2 pts/session', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
};

const getRankDisplay = (rank) => {
  if (rank === 1) return { icon: <Trophy className="w-5 h-5" />, bg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700' };
  if (rank === 2) return { icon: <Medal className="w-5 h-5" />, bg: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-600' };
  if (rank === 3) return { icon: <Medal className="w-5 h-5" />, bg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700' };
  return { icon: <span className="text-sm font-bold">#{rank}</span>, bg: 'bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700' };
};

const getStarRating = (avg) => {
  const stars = Math.round(avg || 0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`w-3.5 h-3.5 ${s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
      ))}
    </div>
  );
};

const MentorRewardLeaderboard = ({ college }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);

  const { data, isLoading } = useQuery(
    ['mentor-reward-leaderboard', college],
    () => api.get('/mentorship/rewards/leaderboard', { params: college ? { college } : {} }),
    { keepPreviousData: true }
  );

  const leaderboard = data?.data?.leaderboard || [];

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col w-full items-center justify-center py-20 gap-3 text-gray-400 min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="text-sm">Loading mentor rankings...</span>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-16 flex-1 flex flex-col items-center justify-center w-full min-h-[400px]">
        <div className="p-5 bg-gradient-to-br from-primary-50 to-alumni-50 dark:from-primary-900/20 dark:to-alumni-900/20 rounded-2xl inline-block mb-4">
          <Trophy className="w-14 h-14 text-yellow-400 mx-auto" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Mentor Rankings Yet</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Mentors earn reward points by accepting and completing mentorships and receiving student feedback. Be the first to appear here!
        </p>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto">
          {Object.values(POINT_BREAKDOWN_LABELS).map(({ label, pts, color }) => (
            <div key={label} className={`rounded-xl px-3 py-2 text-center ${color}`}>
              <p className="text-xs font-bold">{pts}</p>
              <p className="text-xs mt-0.5 opacity-80">{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Top 3 podium
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-6 flex-1 flex flex-col w-full">
      {/* Point System Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.values(POINT_BREAKDOWN_LABELS).map(({ label, pts, color }) => (
          <div key={label} className={`rounded-xl px-4 py-3 text-center ${color}`}>
            <p className="text-sm font-bold">{pts}</p>
            <p className="text-xs mt-0.5 opacity-80">{label}</p>
          </div>
        ))}
      </div>

      {/* Top 3 Podium */}
      {top3.length > 0 && (
        <div className="flex flex-col md:flex-row items-end justify-center gap-4 pb-4">
          {/* 2nd place */}
          {top3[1] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => navigate(`/users/${top3[1].mentorId}`)}
            >
              <UserAvatar src={top3[1].photo} name={top3[1].name} className="w-16 h-16 mb-2 ring-2 ring-gray-300 dark:ring-gray-600" />
              <div className="text-center mb-2">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[100px]">{top3[1].name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{top3[1].company || top3[1].industry}</p>
                {getStarRating(top3[1].breakdown?.averageRating)}
              </div>
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-t-xl flex flex-col items-center py-3 h-24">
                <Medal className="w-5 h-5 text-gray-500 mb-1" />
                <span className="text-lg font-black text-gray-700 dark:text-gray-300">{top3[1].totalPoints}</span>
                <span className="text-[10px] text-gray-500">pts</span>
              </div>
            </motion.div>
          )}
          {/* 1st place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center cursor-pointer group"
            onClick={() => navigate(`/users/${top3[0].mentorId}`)}
          >
            <div className="relative">
              <UserAvatar src={top3[0].photo} name={top3[0].name} className="w-20 h-20 mb-2 ring-4 ring-yellow-400" />
              <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                <Trophy className="w-4 h-4 text-yellow-900" />
              </div>
            </div>
            <div className="text-center mb-2">
              <p className="font-bold text-gray-900 dark:text-white truncate max-w-[110px]">{top3[0].name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[110px]">{top3[0].company || top3[0].industry}</p>
              {getStarRating(top3[0].breakdown?.averageRating)}
            </div>
            <div className="w-24 bg-yellow-400 rounded-t-xl flex flex-col items-center py-3 h-32">
              <span className="text-xs font-bold text-yellow-900 mb-1">🥇 #1</span>
              <span className="text-xl font-black text-yellow-900">{top3[0].totalPoints}</span>
              <span className="text-xs text-yellow-800">pts</span>
            </div>
          </motion.div>
          {/* 3rd place */}
          {top3[2] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => navigate(`/users/${top3[2].mentorId}`)}
            >
              <UserAvatar src={top3[2].photo} name={top3[2].name} className="w-16 h-16 mb-2 ring-2 ring-orange-300 dark:ring-orange-600" />
              <div className="text-center mb-2">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate max-w-[100px]">{top3[2].name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{top3[2].company || top3[2].industry}</p>
                {getStarRating(top3[2].breakdown?.averageRating)}
              </div>
              <div className="w-24 bg-orange-200 dark:bg-orange-800/40 rounded-t-xl flex flex-col items-center py-3 h-20">
                <Medal className="w-5 h-5 text-orange-600 mb-1" />
                <span className="text-lg font-black text-orange-700 dark:text-orange-300">{top3[2].totalPoints}</span>
                <span className="text-[10px] text-orange-600">pts</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Full Table */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-700">
                <th className="px-5 py-4">Rank</th>
                <th className="px-5 py-4">Mentor</th>
                <th className="px-5 py-4">College</th>
                <th className="px-5 py-4">Avg Rating</th>
                <th className="px-5 py-4">Mentees</th>
                <th className="px-5 py-4 text-right">Reward Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {leaderboard.map((mentor, index) => {
                const { icon, bg } = getRankDisplay(mentor.rank);
                const isMe = mentor.mentorId === (user?._id || user?.id);
                const isExpanded = expandedId === mentor.mentorId;
                return (
                  <React.Fragment key={mentor.mentorId}>
                    <motion.tr
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className={`cursor-pointer transition-colors ${isMe ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                      onClick={() => setExpandedId(isExpanded ? null : mentor.mentorId)}
                    >
                      <td className="px-5 py-4">
                        <div className={`flex items-center justify-center w-9 h-9 rounded-full ${bg}`}>
                          {icon}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar src={mentor.photo} name={mentor.name} className="w-10 h-10" />
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              {mentor.name}
                              {isMe && (
                                <span className="text-[10px] uppercase tracking-wider bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded border border-primary-200">You</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{mentor.position || mentor.industry}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate max-w-[160px]">{mentor.college || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{mentor.company || ''}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          {getStarRating(mentor.breakdown?.averageRating)}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {mentor.breakdown?.averageRating ? `${mentor.breakdown.averageRating.toFixed(1)} avg` : 'No ratings yet'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {mentor.breakdown?.completedMentorships || 0} completed
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{mentor.breakdown?.acceptedRequests || 0} accepted</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-500 to-orange-500">
                            {mentor.totalPoints}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">reward pts</span>
                      </td>
                    </motion.tr>
                    {/* Expanded breakdown row */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-5 py-0 bg-gray-50/70 dark:bg-gray-900/30">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="py-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Object.entries(POINT_BREAKDOWN_LABELS).map(([key, { label, color }]) => (
                                  <div key={key} className={`rounded-xl px-4 py-2 ${color}`}>
                                    <p className="text-xs font-semibold">{label}</p>
                                    <p className="text-lg font-black">
                                      {key === 'feedbackPoints' || key === 'sessionPoints'
                                        ? mentor.breakdown?.[key] || 0
                                        : mentor.breakdown?.[key] || 0}
                                      {(key !== 'feedbackPoints' && key !== 'sessionPoints') ? ' times' : ' pts'}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              <div className="pb-3 flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigate(`/users/${mentor.mentorId}`); }}
                                  className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                  View Profile
                                </button>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MentorRewardLeaderboard;
