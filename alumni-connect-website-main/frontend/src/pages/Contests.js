import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Search, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Calendar as CalendarIcon, MapPin, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import PlatformIcon from '../components/PlatformIcon';
import { useAuth } from '../contexts/AuthContext';

const getPlatformColor = (platform) => {
  const p = platform?.toLowerCase() || '';
  if (p.includes('leetcode')) return '#FFA116';
  if (p.includes('codeforces')) return '#1f8bcb';
  if (p.includes('codechef')) return '#5D4037';
  if (p.includes('hackerrank')) return '#2EC866';
  if (p.includes('gfg') || p.includes('geeks')) return '#2F8D46';
  if (p.includes('atcoder')) return '#222222';
  return '#6366f1'; // primary
};

const Contests = () => {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch local contests
  const { data: contestsData, isLoading: localLoading } = useQuery(
    ['contests'],
    () => api.get('/contests', { params: { limit: 100 } }),
    { keepPreviousData: true }
  );

  // Fetch external contests
  const { data: externalContests, isLoading: externalLoading } = useQuery(
    ['external-contests'],
    async () => {
      try {
        const response = await api.get('/contests/external');
        return response.contests || response.data?.contests || [];
      } catch (err) {
        return [];
      }
    },
    { refetchOnWindowFocus: false }
  );

  const allContests = useMemo(() => {
    const local = contestsData?.contests || [];
    const external = externalContests || [];
    let combined = [...local, ...external].map(c => ({
      ...c,
      start: new Date(c.startDate),
      end: new Date(c.endDate)
    }));

    // Generate some mock contests for the demo if there are none
    if (combined.length === 0 && !localLoading && !externalLoading) {
      const today = new Date();
      const mockPlatforms = ['LeetCode', 'Codeforces', 'CodeChef', 'GeeksForGeeks', 'AtCoder'];
      for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + Math.floor(Math.random() * 30));
        const plat = mockPlatforms[Math.floor(Math.random() * mockPlatforms.length)];
        combined.push({
          _id: `mock-${i}`,
          title: `${plat} Weekly Contest ${Math.floor(Math.random() * 100) + 200}`,
          platform: plat,
          isExternal: true,
          externalLink: '#',
          start: date,
          end: new Date(date.getTime() + 2 * 60 * 60 * 1000)
        });
      }
    }

    if (search) {
      combined = combined.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.platform?.toLowerCase().includes(search.toLowerCase()));
    }

    return combined.sort((a, b) => a.start - b.start);
  }, [contestsData, externalContests, search, localLoading, externalLoading]);

  // Group upcoming contests by date (for the left panel)
  const upcomingContestsGrouped = useMemo(() => {
    const grouped = {};
    const now = new Date();
    // Only show future contests in upcoming panel
    const upcoming = allContests.filter(c => c.end > now);
    upcoming.forEach(c => {
      const dateStr = c.start.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(c);
    });
    return grouped;
  }, [allContests]);

  // Calendar logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDays - i) });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i) });
    }
    // Next month padding (to fill 42 cells = 6 weeks)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, isCurrentMonth: false, date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i) });
    }
    return days;
  }, [currentDate, daysInMonth, firstDayOfMonth, prevMonthDays]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getGoogleCalendarUrl = (c) => {
    const text = encodeURIComponent(c.title);
    const location = encodeURIComponent(c.platform || 'Virtual');
    const start = c.start.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = c.end.toISOString().replace(/-|:|\.\d\d\d/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&location=${location}`;
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6">
        
        {/* Top Header Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search Contests" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] text-gray-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow placeholder-gray-500 border border-[#2a2a2a]"
            />
          </div>
          <div className="relative w-full sm:w-72">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#222] transition-colors">
              <span>All Platforms Selected</span>
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </div>
          </div>
          {isAdmin() && (
            <button
              onClick={() => alert('Create contest modal logic goes here')}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md font-semibold shrink-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create
            </button>
          )}
        </div>

        {/* Main Grid */}
        <div className="flex flex-col xl:flex-row gap-8">
          
          {/* Left Panel: Upcoming */}
          <div className="w-full xl:w-[400px] shrink-0">
            <h2 className="text-2xl font-bold mb-1">Upcoming Contests</h2>
            <p className="text-gray-400 text-sm mb-6">Don't miss scheduled events</p>
            
            <div className="space-y-6 h-[750px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.keys(upcomingContestsGrouped).length > 0 ? (
                Object.entries(upcomingContestsGrouped).map(([dateStr, contests]) => (
                  <div key={dateStr}>
                    <h3 className="text-[#666] text-xs font-bold mb-3 tracking-wider">{dateStr}</h3>
                    <div className="space-y-3">
                      {contests.map(c => (
                        <div key={c._id} className="bg-[#151515] border border-[#222] rounded-xl p-4 hover:border-[#333] transition-colors group">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: getPlatformColor(c.platform) }} />
                            <span className="text-gray-400 text-xs font-medium">
                              {dateStr} {formatTime(c.start)} - {formatTime(c.end)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mb-4">
                            <PlatformIcon platform={c.platform} className="w-5 h-5 shrink-0" />
                            <h4 className="font-semibold text-gray-200 leading-tight group-hover:text-white transition-colors">{c.title}</h4>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-[#222]">
                            <a href={getGoogleCalendarUrl(c)} target="_blank" rel="noreferrer" className="flex items-center text-[#555] hover:text-[#888] text-xs font-medium transition-colors">
                              <MapPin className="w-3.5 h-3.5 mr-1.5" />
                              Add to Calendar
                            </a>
                            {c.externalLink && (
                              <a href={c.externalLink} target="_blank" rel="noreferrer" className="text-[#555] hover:text-indigo-400 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-center py-10">No upcoming contests found.</div>
              )}
            </div>
          </div>

          {/* Right Panel: Calendar Grid */}
          <div className="flex-1 bg-[#121212] border border-[#222] rounded-2xl p-6 flex flex-col h-[850px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg border border-[#333] transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-300" />
                </button>
                <button onClick={nextMonth} className="p-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded-lg border border-[#333] transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
              </div>
            </div>

            {/* Calendar Header */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-[#666] pb-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="grid grid-cols-7 flex-1 border-t border-l border-[#222] overflow-hidden rounded-bl-xl rounded-br-xl">
              {calendarDays.map((cell, idx) => {
                const cellDateStr = cell.date.toLocaleDateString('en-US');
                const dayContests = allContests.filter(c => c.start.toLocaleDateString('en-US') === cellDateStr);
                
                return (
                  <div key={idx} className={`min-h-[100px] border-r border-b border-[#222] p-2 flex flex-col ${!cell.isCurrentMonth ? 'bg-[#0a0a0a]' : 'bg-[#151515] hover:bg-[#1a1a1a]'} transition-colors`}>
                    <div className={`text-xs font-semibold mb-2 text-right ${!cell.isCurrentMonth ? 'text-[#444]' : 'text-gray-400'}`}>
                      {cell.day}
                    </div>
                    <div className="space-y-1.5 overflow-hidden flex-1">
                      {dayContests.slice(0, 3).map(c => (
                        <a 
                          key={c._id} 
                          href={c.externalLink || '#'} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#222] hover:bg-[#333] transition-colors"
                        >
                          <PlatformIcon platform={c.platform} className="w-3 h-3 shrink-0" />
                          <span className="text-[10px] text-gray-300 truncate font-medium">{c.title}</span>
                        </a>
                      ))}
                      {dayContests.length > 3 && (
                        <div className="text-[10px] text-gray-500 font-medium px-2 py-0.5">
                          +{dayContests.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #111;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
};

export default Contests;
