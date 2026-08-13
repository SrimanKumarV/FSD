import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Search, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Calendar as CalendarIcon, MapPin, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../utils/api';
import PlatformIcon from '../components/PlatformIcon';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const getPlatformColor = (platform) => {
  const p = platform?.toLowerCase() || '';
  if (p.includes('leetcode')) return '#FFA116';
  if (p.includes('codeforces')) return '#1f8bcb';
  if (p.includes('codechef')) return '#5D4037';
  if (p.includes('hackerrank')) return '#2EC866';
  if (p.includes('gfg') || p.includes('geeks')) return '#2F8D46';
  if (p.includes('atcoder')) return '#222222';
  return '#6366f1'; // primary for events
};

const getGoogleCalendarUrl = (event) => {
  const text = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(event.location || event.platform || 'Online');
  const formatGoogleDate = (dateObj) => dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
  const startDate = formatGoogleDate(event.start);
  const endDate = event.end ? formatGoogleDate(event.end) : startDate;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
};

const Events = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', startDate: '', endDate: '', location: '', eventType: 'webinar', category: 'technology',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    isVirtual: false,
    isRegistrationRequired: true,
    isFree: true
  });

  const platformsList = ['All', 'Events', 'LeetCode', 'Codeforces', 'CodeChef', 'GeeksForGeeks', 'HackerRank'];

  // Fetch local events
  const { data: eventsData, isLoading: eventsLoading, refetch: refetchEvents } = useQuery(
    ['events'],
    () => api.get('/events', { params: { limit: 100 } }),
    { keepPreviousData: true }
  );

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

  const allItems = useMemo(() => {
    const evts = (eventsData?.events || []).map(e => ({
      ...e,
      isEvent: true,
      platform: 'Event',
      start: new Date(e.startDate),
      end: new Date(e.endDate || e.startDate)
    }));

    const locContests = (contestsData?.contests || []).map(c => ({
      ...c,
      isEvent: false,
      start: new Date(c.startDate),
      end: new Date(c.endDate)
    }));

    const extContests = (externalContests || []).map(c => ({
      ...c,
      isEvent: false,
      start: new Date(c.startDate),
      end: new Date(c.endDate)
    }));

    let combined = [...evts, ...locContests, ...extContests];

    if (search) {
      combined = combined.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.platform?.toLowerCase().includes(search.toLowerCase()));
    }

    if (platformFilter !== 'All') {
      if (platformFilter === 'Events') {
        combined = combined.filter(c => c.isEvent);
      } else {
        combined = combined.filter(c => c.platform?.toLowerCase().includes(platformFilter.toLowerCase()) || (platformFilter === 'GeeksForGeeks' && c.platform?.toLowerCase().includes('gfg')));
      }
    }

    return combined.sort((a, b) => a.start - b.start);
  }, [eventsData, contestsData, externalContests, search, platformFilter]);

  const upcomingItemsGrouped = useMemo(() => {
    const grouped = {};
    const now = new Date();
    const upcoming = allItems.filter(c => c.end > now);
    upcoming.forEach(c => {
      const dateStr = c.start.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(c);
    });
    return grouped;
  }, [allItems]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const calendarDays = useMemo(() => {
    const days = [];
    const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDays - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, date: new Date(currentDate.getFullYear(), currentDate.getMonth(), i) });
    }
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, isCurrentMonth: false, date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i) });
    }
    return days;
  }, [currentDate, daysInMonth, firstDayOfMonth]);

  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/events', formData);
      toast.success('Event created successfully!');
      setShowCreateModal(false);
      refetchEvents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 flex flex-col p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col h-full space-y-6">
        
        {/* Header / Search Area */}
        <div className="flex flex-col sm:flex-row gap-4 items-center shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Events & Contests" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/50 backdrop-blur-md text-slate-800 dark:text-slate-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-slate-700/50 shadow-sm dark:shadow-inner"
            />
          </div>
          <div className="relative w-full sm:w-72">
            <div 
              onClick={() => setShowPlatformDropdown(!showPlatformDropdown)}
              className="bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm dark:shadow-inner"
            >
              <span>{platformFilter === 'All' ? 'All Selected' : platformFilter}</span>
              <ChevronDown className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform ${showPlatformDropdown ? 'rotate-180' : ''}`} />
            </div>
            
            <AnimatePresence>
              {showPlatformDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  {platformsList.map(plat => (
                    <div 
                      key={plat}
                      onClick={() => { setPlatformFilter(plat); setShowPlatformDropdown(false); }}
                      className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-600 dark:hover:text-white cursor-pointer transition-colors"
                    >
                      {plat}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {(user?.role === 'admin' || user?.role === 'alumni') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-indigo-600/90 backdrop-blur-md text-white rounded-xl hover:bg-indigo-600 transition-colors shadow-lg font-semibold shrink-0"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create
            </button>
          )}
        </div>

        {/* Main Grid */}
        <div className="flex flex-col xl:flex-row gap-8 flex-1 min-h-0">
          
          {/* Left Panel: Upcoming */}
          <div className="w-full xl:w-[350px] shrink-0 flex flex-col h-full max-h-[80vh]">
            <div className="shrink-0 mb-4">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white drop-shadow-md">Upcoming Events & Contests</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Don't miss scheduled events</p>
            </div>
            
            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
              {Object.keys(upcomingItemsGrouped).length > 0 ? (
                Object.entries(upcomingItemsGrouped).map(([dateStr, items]) => (
                  <div key={dateStr}>
                    <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-3 tracking-wider">{dateStr}</h3>
                    <div className="space-y-3">
                      {items.map(c => (
                        <div key={c._id || Math.random()} className="bg-white/80 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-sm group">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full shadow-sm" style={{ background: getPlatformColor(c.platform) }} />
                            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                              {dateStr} {formatTime(c.start)} - {formatTime(c.end)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mb-4">
                            {c.isEvent ? (
                              <CalendarIcon className="w-5 h-5 shrink-0 text-indigo-500" />
                            ) : (
                              <PlatformIcon platform={c.platform} className="w-5 h-5 shrink-0" />
                            )}
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">{c.title}</h4>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700/50">
                            <a href={getGoogleCalendarUrl(c)} target="_blank" rel="noreferrer" className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition-colors">
                              <MapPin className="w-3.5 h-3.5 mr-1.5" />
                              Add to Calendar
                            </a>
                            {c.externalLink && (
                              <a href={c.externalLink} target="_blank" rel="noreferrer" className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
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
                <div className="text-slate-500 text-center py-10 bg-slate-100 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-700/30 border-dashed">No upcoming items found.</div>
              )}
            </div>
          </div>

          {/* Right Panel: Calendar Grid */}
          <div className="flex-1 bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 rounded-[2rem] p-6 flex flex-col h-[80vh] shadow-xl dark:shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">
                {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
                <button onClick={nextMonth} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>

            {/* Calendar Header */}
            <div className="grid grid-cols-7 mb-2 shrink-0 relative z-10">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-bold text-slate-400 dark:text-slate-500 pb-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Body */}
            <div className="grid grid-cols-7 flex-1 border-t border-l border-slate-200 dark:border-slate-700/50 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-900/50 relative z-10">
              {calendarDays.map((cell, idx) => {
                const cellDateStr = cell.date.toLocaleDateString('en-US');
                const dayItems = allItems.filter(c => c.start.toLocaleDateString('en-US') === cellDateStr);
                
                return (
                  <div key={idx} className={`min-h-[80px] border-r border-b border-slate-200 dark:border-slate-700/50 p-1.5 sm:p-2 flex flex-col ${!cell.isCurrentMonth ? 'bg-slate-100/50 dark:bg-slate-900/30' : 'bg-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/30'} transition-colors`}>
                    <div className={`text-xs font-bold mb-1 sm:mb-2 text-right ${!cell.isCurrentMonth ? 'text-slate-400 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400'}`}>
                      {cell.day}
                    </div>
                    <div className="space-y-1.5 overflow-y-auto flex-1 custom-scrollbar min-h-0 pr-1">
                      {dayItems.slice(0, 4).map(c => (
                        <a 
                          key={c._id || Math.random()} 
                          href={c.externalLink || '#'} 
                          target={c.externalLink ? "_blank" : "_self"} 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/50 shadow-sm transition-colors"
                        >
                          {c.isEvent ? (
                             <CalendarIcon className="w-3 h-3 shrink-0 text-indigo-500" />
                          ) : (
                             <PlatformIcon platform={c.platform} className="w-3 h-3 shrink-0" />
                          )}
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate font-semibold">{c.title}</span>
                        </a>
                      ))}
                      {dayItems.length > 4 && (
                        <div className="text-[10px] text-slate-500 font-bold px-2 py-0.5">
                          +{dayItems.length - 4} more
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
      
      {/* Create Event Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Event</h2>
                <button type="button" onClick={() => setShowCreateModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Title</label>
                  <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none" rows="3"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                    <input type="datetime-local" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                    <input type="datetime-local" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white [color-scheme:light] dark:[color-scheme:dark]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location / Platform</label>
                    <input type="text" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type</label>
                    <select value={formData.eventType} onChange={e => setFormData({...formData, eventType: e.target.value})} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white">
                      <option value="webinar">Webinar</option>
                      <option value="exam">Exam</option>
                      <option value="workshop">Workshop</option>
                      <option value="seminar">Seminar</option>
                      <option value="networking">Networking</option>
                      <option value="conference">Conference</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="meetup">Meetup</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={formData.isVirtual} onChange={e => setFormData({...formData, isVirtual: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    <span>Is Virtual?</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={formData.isRegistrationRequired} onChange={e => setFormData({...formData, isRegistrationRequired: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    <span>Requires Reg?</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={formData.isFree} onChange={e => setFormData({...formData, isFree: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" />
                    <span>Is Free?</span>
                  </label>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 px-4 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-semibold">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 px-4 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50">
                    {isSubmitting ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      `}</style>
    </div>
  );
};

export default Events;
