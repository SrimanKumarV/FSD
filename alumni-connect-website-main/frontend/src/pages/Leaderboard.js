import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Trophy, Medal, Search, Activity, Globe, MapPin, Building2, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const COLLEGES = [
  'Kongu Engineering College',
  'IIT Bombay',
  'IIT Delhi',
  'IIT Madras',
  'NIT Trichy',
  'VIT Vellore',
  'BITS Pilani',
  'PSG College of Technology',
  'Anna University'
];

const COUNTRIES = [
  'India',
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Singapore',
  'Germany'
];

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('Global'); // 'Global', 'Country', 'College'
  const [selectedCountry, setSelectedCountry] = useState(user?.country || 'India');
  const [selectedCollege, setSelectedCollege] = useState(user?.college || 'Kongu Engineering College');
  
  const [showDropdown, setShowDropdown] = useState(false);

  const { data, isLoading, error } = useQuery(
    ['leaderboard', activeTab, selectedCountry, selectedCollege],
    () => {
      const params = {};
      if (activeTab === 'Country') params.country = selectedCountry;
      if (activeTab === 'College') params.college = selectedCollege;
      return api.get('/leaderboard', { params });
    },
    { keepPreviousData: true }
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
            <h1 className="text-3xl font-bold mb-2">
              {activeTab === 'Global' && 'Global Leaderboard'}
              {activeTab === 'Country' && `${selectedCountry} Leaderboard`}
              {activeTab === 'College' && `${selectedCollege} Leaderboard`}
            </h1>
            <p className="text-primary-100 max-w-lg text-lg">
              {activeTab === 'Global' && 'The top developers from all around the world.'}
              {activeTab === 'Country' && `The top developers representing ${selectedCountry}.`}
              {activeTab === 'College' && `The top developers from ${selectedCollege}.`}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('Global')}
            className={`flex-1 sm:flex-none flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'Global' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Globe className="w-4 h-4 mr-2" /> Global
          </button>
          <button
            onClick={() => setActiveTab('Country')}
            className={`flex-1 sm:flex-none flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'Country' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <MapPin className="w-4 h-4 mr-2" /> Country
          </button>
          <button
            onClick={() => setActiveTab('College')}
            className={`flex-1 sm:flex-none flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'College' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Building2 className="w-4 h-4 mr-2" /> College
          </button>
        </div>

        {activeTab !== 'Global' && (
          <div className="relative w-full sm:w-64">
            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer shadow-sm hover:border-primary-500 transition-colors"
            >
              <span className="truncate mr-2 font-medium">
                {activeTab === 'Country' ? selectedCountry : selectedCollege}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${showDropdown ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto"
                >
                  {(activeTab === 'Country' ? COUNTRIES : COLLEGES).map(item => (
                    <div 
                      key={item}
                      onClick={() => { 
                        if (activeTab === 'Country') setSelectedCountry(item);
                        else setSelectedCollege(item);
                        setShowDropdown(false); 
                      }}
                      className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      {item}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Developer</th>
                <th className="px-6 py-4">College & Country</th>
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
                      onClick={() => navigate(`/devpulse/${profile.userId}`)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isCurrentUser ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRankBadge(profile.rank)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-alumni-500 flex items-center justify-center text-white font-medium shadow-sm">
                            {profile.photo ? (
                              <img loading="lazy" src={profile.photo} alt={profile.name} className="w-full h-full rounded-full object-cover" />
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
                        <div className="text-sm text-gray-900 dark:text-gray-300 font-medium truncate max-w-[150px]" title={profile.college || 'N/A'}>{profile.college || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{profile.country || 'India'}</div>
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
