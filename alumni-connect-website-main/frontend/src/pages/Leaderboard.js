import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from 'react-query';
import { Trophy, Medal, Activity, Globe, MapPin, Building2, ChevronDown, Search, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const COUNTRIES_WITH_FLAGS = [
  { name: 'India', flag: '🇮🇳' },
  { name: 'United States', flag: '🇺🇸' },
  { name: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'Malaysia', flag: '🇲🇾' },
  { name: 'United Arab Emirates', flag: '🇦🇪' },
];

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('Global');
  const [selectedCountry, setSelectedCountry] = useState(user?.country || 'India');
  const [selectedCollege, setSelectedCollege] = useState(user?.college || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [universities, setUniversities] = useState([]);
  const [loadingUnis, setLoadingUnis] = useState(false);
  const debounceRef = useRef(null);

  const fetchUniversities = useCallback(async (countryName, query) => {
    setLoadingUnis(true);
    try {
      const url = query
        ? `https://universities.hipolabs.com/search?country=${encodeURIComponent(countryName)}&name=${encodeURIComponent(query)}`
        : `https://universities.hipolabs.com/search?country=${encodeURIComponent(countryName)}`;
      const res = await fetch(url);
      const data = await res.json();
      setUniversities(data.slice(0, 60).map(u => u.name));
    } catch {
      setUniversities([]);
    } finally {
      setLoadingUnis(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'College' && showDropdown) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchUniversities(selectedCountry, dropdownSearch);
      }, 350);
    }
    return () => clearTimeout(debounceRef.current);
  }, [activeTab, showDropdown, selectedCountry, dropdownSearch, fetchUniversities]);

  const { data, isLoading } = useQuery(
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
          <div className="relative w-full sm:w-80">
            <div 
              onClick={() => { setShowDropdown(!showDropdown); setDropdownSearch(''); }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer shadow-sm hover:border-primary-500 transition-colors"
            >
              <span className="truncate mr-2 font-medium flex items-center gap-2">
                {activeTab === 'Country' && (
                  <span>{COUNTRIES_WITH_FLAGS.find(c => c.name === selectedCountry)?.flag}</span>
                )}
                {activeTab === 'Country' ? selectedCountry : (selectedCollege || 'Select a college')}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${showDropdown ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={activeTab === 'Country' ? 'Search country...' : `Search universities in ${selectedCountry}...`}
                        value={dropdownSearch}
                        onChange={e => setDropdownSearch(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        autoFocus
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {activeTab === 'Country' ? (
                      COUNTRIES_WITH_FLAGS
                        .filter(c => c.name.toLowerCase().includes(dropdownSearch.toLowerCase()))
                        .map(c => (
                          <div key={c.name} onClick={() => { setSelectedCountry(c.name); setDropdownSearch(''); setShowDropdown(false); }}
                            className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center gap-3 ${selectedCountry === c.name ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                          >
                            <span className="text-base">{c.flag}</span> {c.name}
                          </div>
                        ))
                    ) : loadingUnis ? (
                      <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                        <span className="text-sm">Loading universities...</span>
                      </div>
                    ) : universities.length > 0 ? (
                      universities.map((name, i) => (
                        <div key={i} onClick={() => { setSelectedCollege(name); setDropdownSearch(''); setShowDropdown(false); }}
                          className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center gap-3 ${selectedCollege === name ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                          <Building2 className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          <span className="truncate">{name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400 text-sm">
                        {dropdownSearch ? 'No universities found' : 'Type to search...'}
                      </div>
                    )}
                  </div>
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
