import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  Video,
  Globe,
  Plus,
  Bookmark,
  ExternalLink,
  Eye,
  TrendingUp,
  CalendarDays,
  ChevronRight,
  LayoutGrid,
  List,
  CalendarPlus
} from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays 
} from 'date-fns';
import { api } from '../utils/api';
import PlatformIcon from '../components/PlatformIcon';
import toast from 'react-hot-toast';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    q: '',
    category: '',
    eventType: '',
    location: '',
    isVirtual: '',
    isFree: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sortBy, setSortBy] = useState('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('calendar'); // grid, list, or calendar
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [filters, sortBy, currentPage]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/events', { 
        params: { 
          ...filters, 
          page: currentPage, 
          sort: sortBy 
        } 
      });
      let localEvents = response.events || [];
      setTotalPages(response.pagination?.pages || 1);

      // Also fetch external contests for the calendar!
      try {
        const extRes = await api.get('/contests/external');
        // Handle axios response wrapper (.data or direct array depending on api utility)
        const extContests = extRes.contests || extRes.data?.contests || [];
        if (extContests.length > 0) {
          const mappedExt = extContests.map(c => ({
            id: c._id,
            title: c.title,
            description: c.description,
            startDate: c.startDate,
            endDate: c.endDate,
            category: 'coding',
            eventType: 'contest',
            isVirtual: true,
            location: 'Global (Online)',
            isFree: true,
            currentRegistrations: 0,
            maxCapacity: null,
            views: 0,
            isExternal: true,
            platform: c.platform,
            externalLink: c.externalLink
          }));
          localEvents = [...localEvents, ...mappedExt];
        }
      } catch (err) {
        console.error('Failed to fetch external contests for events page', err);
      }

      setEvents(localEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleRegister = async (eventId) => {
    try {
      await api.post(`/events/${eventId}/register`);
      toast.success('Registered successfully!');
      fetchEvents(); // refresh registrations count
    } catch (error) {
      console.error('Error registering for event:', error);
      toast.error(error.response?.data?.message || 'Failed to register');
    }
  };

  const handleSave = async (eventId) => {
    toast.error('Saving events is not supported yet');
  };

  const sortedEvents = events; // Backend handles sorting and filtering

  const getEventTypeColor = (eventType) => {
    switch (eventType) {
      case 'workshop': return 'text-blue-600 bg-blue-100';
      case 'webinar': return 'text-green-600 bg-green-100';
      case 'conference': return 'text-purple-600 bg-purple-100';
      case 'meetup': return 'text-yellow-600 bg-yellow-100';
      case 'hackathon': return 'text-red-600 bg-red-100';
      case 'career_fair': return 'text-indigo-600 bg-indigo-100';
      case 'contest': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'technology': return 'text-blue-600 bg-blue-100';
      case 'business': return 'text-green-600 bg-green-100';
      case 'healthcare': return 'text-red-600 bg-red-100';
      case 'education': return 'text-purple-600 bg-purple-100';
      case 'finance': return 'text-yellow-600 bg-yellow-100';
      case 'marketing': return 'text-pink-600 bg-pink-100';
      case 'design': return 'text-indigo-600 bg-indigo-100';
      case 'career': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeUntilEvent = (startDate) => {
    const now = new Date();
    const eventDate = new Date(startDate);
    const diffTime = eventDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Past';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
    return `${Math.ceil(diffDays / 30)} months`;
  };

  const isEventFull = (event) => {
    return event.maxCapacity && event.currentRegistrations >= event.maxCapacity;
  };

  const isEventUpcoming = (event) => {
    return new Date(event.startDate) > new Date();
  };

  const getGoogleCalendarUrl = (event) => {
    const text = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.isVirtual ? `Virtual (${event.virtualPlatform || 'Online'})` : event.location || '');
    const formatGoogleDate = (dateString) => {
      const date = new Date(dateString);
      return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    };
    const startDate = formatGoogleDate(event.startDate);
    const endDate = event.endDate ? formatGoogleDate(event.endDate) : startDate;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
  };

  // Calendar View Component
  const CalendarView = ({ events, onSelectEvent }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "MMMM yyyy";
    const days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        const dayEvents = events.filter(e => isSameDay(new Date(e.startDate), cloneDay));

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] p-2 border-r border-b border-gray-200/50 dark:border-gray-700/50 ${
              !isSameMonth(day, monthStart)
                ? "bg-gray-50/50 dark:bg-gray-800/20 text-gray-400"
                : "bg-white dark:bg-gray-800/80 text-gray-900 dark:text-gray-100"
            } hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}
          >
            <div className="flex justify-end mb-1">
              <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                isSameDay(day, new Date()) ? "bg-primary-600 text-white shadow-md shadow-primary-500/30" : ""
              }`}>
                {formattedDate}
              </span>
            </div>
            <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
              {dayEvents.map((event, idx) => (
                <div
                  key={idx}
                  onClick={() => event.isExternal ? window.open(event.externalLink, '_blank') : onSelectEvent(event)}
                  className={`text-xs truncate px-2 py-1.5 rounded-lg font-medium cursor-pointer transition-colors shadow-sm ${
                    event.isExternal 
                      ? (event.platform === 'LeetCode' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                         event.platform === 'CodeChef' ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' :
                         event.platform === 'GeeksForGeeks' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                         'bg-indigo-100 text-indigo-800 hover:bg-indigo-200')
                      : 'bg-primary-100/80 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800'
                  }`}
                  title={event.title}
                >
                  <span className="font-bold opacity-75 mr-1">{format(new Date(event.startDate), "HH:mm")}</span>
                  {event.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
    }

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm mb-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {format(currentDate, dateFormat)}
          </h2>
          <div className="flex space-x-2">
            <button onClick={prevMonth} className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button onClick={nextMonth} className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-gray-200/50 dark:border-gray-700/50 bg-gray-50/80 dark:bg-gray-900/50">
          {weekdays.map(day => (
            <div key={day} className="py-3 text-center text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-white dark:bg-gray-800">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-400/20 to-alumni-400/20 dark:from-primary-500/10 dark:to-alumni-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Events & Webinars</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                Discover exciting events, workshops, and networking opportunities
              </p>
            </div>
            {user?.role === 'alumni' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div whileHover={{ y: -5 }} className="text-center p-6 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl shadow-sm">
              <CalendarDays className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{events.length}</p>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">Total Events</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="text-center p-6 bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-2xl shadow-sm">
              <Users className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{events.reduce((sum, event) => sum + event.registrations, 0)}</p>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">Total Registrations</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="text-center p-6 bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-2xl shadow-sm">
              <Eye className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{events.reduce((sum, event) => sum + event.views, 0)}</p>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mt-1">Total Views</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="text-center p-6 bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 rounded-2xl shadow-sm">
              <Video className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{events.filter(event => event.isVirtual).length}</p>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-1">Virtual Events</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Sticky Filters Area */}
        <div className="mb-8">
          <div className="max-w-7xl mx-auto">
            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-4 sm:p-6 shadow-sm"
            >
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events by title, description, or organizer..."
                className="glass-input w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none"
                value={filters.q}
                onChange={(e) => handleFilterChange('q', e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-6 py-3 glass-card rounded-xl hover:bg-white/90 dark:hover:bg-gray-700/80 transition-all font-semibold text-gray-700 dark:text-gray-200"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="glass-input px-6 py-3 rounded-xl focus:outline-none"
            >
              <option value="upcoming">Upcoming First</option>
              <option value="recent">Recent First</option>
              <option value="popular">Most Popular</option>
              <option value="newest">Newest First</option>
            </select>
            <div className="flex items-center space-x-2 bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-xl">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                title="Calendar View"
              >
                <CalendarDays className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all duration-300 flex items-center justify-center ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    <option value="technology">Technology</option>
                    <option value="business">Business</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="finance">Finance</option>
                    <option value="marketing">Marketing</option>
                    <option value="design">Design</option>
                    <option value="career">Career</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Event Type
                  </label>
                  <select
                    value={filters.eventType}
                    onChange={(e) => handleFilterChange('eventType', e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="workshop">Workshop</option>
                    <option value="webinar">Webinar</option>
                    <option value="conference">Conference</option>
                    <option value="meetup">Meetup</option>
                    <option value="hackathon">Hackathon</option>
                    <option value="career_fair">Career Fair</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Format
                  </label>
                  <select
                    value={filters.isVirtual}
                    onChange={(e) => handleFilterChange('isVirtual', e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="">All Formats</option>
                    <option value="true">Virtual Only</option>
                    <option value="false">In-Person Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Price
                  </label>
                  <select
                    value={filters.isFree}
                    onChange={(e) => handleFilterChange('isFree', e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="">All Prices</option>
                    <option value="true">Free Only</option>
                    <option value="false">Paid Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Start Date From
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    End Date To
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, State, or Country"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </motion.div>
          )}
            </motion.div>
          </div>
        </div>

        {/* Events List / Calendar */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView events={sortedEvents} onSelectEvent={(e) => {
            // Can be expanded to open an event detail modal
            window.location.hash = `#event-${e.id}`;
            toast.success(`Selected: ${e.title}`);
          }} />
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
            {sortedEvents.map((event) => (
              <motion.div
                whileHover={{ y: -5 }}
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-card rounded-2xl overflow-hidden relative group transition-all duration-300 ${
                  viewMode === 'list' ? 'flex flex-col md:flex-row' : 'flex flex-col'
                }`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-400/20 to-transparent dark:from-primary-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                
                {/* Event Image/Icon */}
                <div className={`${viewMode === 'list' ? 'md:w-64 md:h-auto h-48 flex-shrink-0' : 'h-48'} bg-gradient-to-br ${event.isExternal ? (
                  event.platform === 'LeetCode' ? 'from-orange-500 to-orange-700' :
                  event.platform === 'CodeChef' ? 'from-amber-600 to-amber-800' :
                  event.platform === 'GeeksForGeeks' ? 'from-green-600 to-green-800' :
                  event.platform === 'Codeforces' ? 'from-blue-600 to-blue-800' :
                  event.platform === 'HackerRank' ? 'from-emerald-500 to-emerald-700' :
                  'from-indigo-500 to-purple-700'
                ) : 'from-primary-500 to-primary-700'} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                  {event.isExternal ? (
                    <PlatformIcon platform={event.platform} className="w-16 h-16 sm:w-20 sm:h-20 text-white relative z-10 drop-shadow-md" />
                  ) : (
                    <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-white relative z-10 drop-shadow-md" />
                  )}
                </div>

                {/* Event Content */}
                <div className={`p-6 relative z-10 flex flex-col flex-1 ${viewMode === 'list' ? 'justify-center' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 pr-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{event.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 leading-relaxed">{event.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSave(event.id)}
                        className="p-2 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors bg-gray-50/50 dark:bg-gray-800/50 rounded-xl"
                      >
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Event Meta */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3">
                        <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      {formatDate(event.startDate)} at {formatTime(event.startDate)}
                    </div>
                    <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      {getTimeUntilEvent(event.startDate)}
                    </div>
                    <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                        {event.isVirtual ? <PlatformIcon platform={event.virtualPlatform} className="w-4 h-4 text-green-600 dark:text-green-400" /> : <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />}
                      </div>
                      {event.isVirtual ? `Virtual (${event.virtualPlatform || 'Online'})` : event.location}
                    </div>
                    <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                        <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      {event.currentRegistrations}/{event.maxCapacity || '∞'} registered
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getEventTypeColor(event.eventType)}`}>
                      {event.eventType.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                    {event.isFree ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold shadow-sm text-green-700 bg-green-100/80 dark:text-green-300 dark:bg-green-900/30 border border-green-200/50 dark:border-green-800/50">
                        Free
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold shadow-sm text-blue-700 bg-blue-100/80 dark:text-blue-300 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50">
                        ${event.price}
                      </span>
                    )}
                  </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center space-x-6 text-sm font-medium text-gray-500 dark:text-gray-400 w-full sm:w-auto">
                          <span className="flex items-center">
                            <Eye className="w-4 h-4 mr-1.5" />
                            {event.views}
                          </span>
                          <span className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1.5" />
                            {event.registrations || 0}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 w-full sm:w-auto">
                          {event.isExternal ? (
                            <a
                              href={event.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 text-center flex justify-center items-center"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Join on {event.platform}
                            </a>
                          ) : isEventFull(event) ? (
                            <span className="flex-1 sm:flex-none text-center px-6 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-bold shadow-sm">
                              Full
                            </span>
                          ) : isEventUpcoming(event) ? (
                            <button
                              onClick={() => handleRegister(event.id)}
                              className="flex-1 sm:flex-none px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                            >
                              Register
                            </button>
                          ) : (
                            <span className="flex-1 sm:flex-none text-center px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold shadow-sm">
                              Past Event
                            </span>
                          )}
                          
                          <a
                            href={getGoogleCalendarUrl(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-xl transition-colors shadow-sm hover:shadow"
                            title="Add to Google Calendar"
                          >
                            <CalendarPlus className="w-5 h-5" />
                          </a>

                          {!event.isExternal && (
                            <button className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl transition-colors shadow-sm hover:shadow">
                              <ExternalLink className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {sortedEvents.length === 0 && !loading && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="glass-card rounded-2xl flex items-center p-2 space-x-1 shadow-sm">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 flex items-center justify-center text-sm font-bold rounded-xl transition-all duration-300 ${
                    currentPage === page
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
