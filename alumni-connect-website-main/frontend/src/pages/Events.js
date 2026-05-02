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
  CalendarDays
} from 'lucide-react';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
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
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  useEffect(() => {
    fetchEvents();
  }, [filters, sortBy, currentPage]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockEvents = [
        {
          id: 1,
          title: 'Tech Career Workshop',
          description: 'Join us for an interactive workshop on building your tech career...',
          eventType: 'workshop',
          category: 'career',
          startDate: '2024-02-15T10:00:00Z',
          endDate: '2024-02-15T16:00:00Z',
          timezone: 'UTC',
          location: 'San Francisco, CA',
          isVirtual: false,
          organizer: { name: 'Tech Alumni Association', photo: null },
          maxCapacity: 50,
          currentRegistrations: 32,
          isRegistrationRequired: true,
          isFree: true,
          views: 156,
          registrations: 32,
          status: 'published'
        },
        {
          id: 2,
          title: 'AI in Healthcare Webinar',
          description: 'Explore the latest developments in AI applications for healthcare...',
          eventType: 'webinar',
          category: 'healthcare',
          startDate: '2024-02-20T14:00:00Z',
          endDate: '2024-02-20T15:30:00Z',
          timezone: 'UTC',
          location: 'Virtual',
          isVirtual: true,
          virtualPlatform: 'Zoom',
          organizer: { name: 'Healthcare Innovation Group', photo: null },
          maxCapacity: 200,
          currentRegistrations: 89,
          isRegistrationRequired: true,
          isFree: false,
          price: 25,
          views: 234,
          registrations: 89,
          status: 'published'
        }
      ];
      setEvents(mockEvents);
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching events:', error);
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
      // TODO: Replace with actual API call
      console.log('Registering for event:', eventId);
    } catch (error) {
      console.error('Error registering for event:', error);
    }
  };

  const handleSave = async (eventId) => {
    try {
      // TODO: Replace with actual API call
      console.log('Saving event:', eventId);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const filteredEvents = events.filter(event => {
    if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !event.description.toLowerCase().includes(filters.search.toLowerCase()) &&
        !event.organizer.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.category && event.category !== filters.category) return false;
    if (filters.eventType && event.eventType !== filters.eventType) return false;
    if (filters.location && !event.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.isVirtual !== '' && event.isVirtual !== (filters.isVirtual === 'true')) return false;
    if (filters.isFree !== '' && event.isFree !== (filters.isFree === 'true')) return false;
    if (filters.startDate && new Date(event.startDate) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(event.endDate) > new Date(filters.endDate)) return false;
    return true;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'upcoming':
        return new Date(a.startDate) - new Date(b.startDate);
      case 'recent':
        return new Date(b.startDate) - new Date(a.startDate);
      case 'popular':
        return b.registrations - a.registrations;
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return new Date(a.startDate) - new Date(b.startDate);
    }
  });

  const getEventTypeColor = (eventType) => {
    switch (eventType) {
      case 'workshop': return 'text-blue-600 bg-blue-100';
      case 'webinar': return 'text-green-600 bg-green-100';
      case 'conference': return 'text-purple-600 bg-purple-100';
      case 'meetup': return 'text-yellow-600 bg-yellow-100';
      case 'hackathon': return 'text-red-600 bg-red-100';
      case 'career_fair': return 'text-indigo-600 bg-indigo-100';
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Events & Webinars</h1>
              <p className="text-gray-600 mt-2">
                Discover exciting events, workshops, and networking opportunities
              </p>
            </div>
            {user?.role === 'alumni' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <CalendarDays className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{events.length}</p>
              <p className="text-sm text-blue-600">Total Events</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{events.reduce((sum, event) => sum + event.registrations, 0)}</p>
              <p className="text-sm text-green-600">Total Registrations</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Eye className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{events.reduce((sum, event) => sum + event.views, 0)}</p>
              <p className="text-sm text-yellow-600">Total Views</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Video className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{events.filter(event => event.isVirtual).length}</p>
              <p className="text-sm text-purple-600">Virtual Events</p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events by title, description, or organizer..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="upcoming">Upcoming First</option>
              <option value="recent">Recent First</option>
              <option value="popular">Most Popular</option>
              <option value="newest">Newest First</option>
            </select>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="w-1.5 h-1.5 bg-current"></div>
                  <div className="w-1.5 h-1.5 bg-current"></div>
                  <div className="w-1.5 h-1.5 bg-current"></div>
                  <div className="w-1.5 h-1.5 bg-current"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <div className="w-4 h-4 space-y-1">
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                  <div className="w-full h-0.5 bg-current"></div>
                </div>
              </button>
            </div>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select
                    value={filters.eventType}
                    onChange={(e) => handleFilterChange('eventType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <select
                    value={filters.isVirtual}
                    onChange={(e) => handleFilterChange('isVirtual', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Formats</option>
                    <option value="true">Virtual Only</option>
                    <option value="false">In-Person Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price
                  </label>
                  <select
                    value={filters.isFree}
                    onChange={(e) => handleFilterChange('isFree', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Prices</option>
                    <option value="true">Free Only</option>
                    <option value="false">Paid Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date From
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date To
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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

        {/* Events List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
            {sortedEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                {/* Event Image/Icon */}
                <div className={`${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''} h-48 bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center`}>
                  <Calendar className="w-16 h-16 text-white" />
                </div>

                {/* Event Content */}
                <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleSave(event.id)}
                        className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                      >
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Event Meta */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(event.startDate)} at {formatTime(event.startDate)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {getTimeUntilEvent(event.startDate)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      {event.isVirtual ? (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Virtual ({event.virtualPlatform})
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          {event.location}
                        </>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {event.currentRegistrations}/{event.maxCapacity || '∞'} registered
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.eventType)}`}>
                      {event.eventType.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                      {event.category}
                    </span>
                    {event.isFree ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-100">
                        Free
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                        ${event.price}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {event.views} views
                      </span>
                      <span className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {event.registrations} registrations
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {isEventFull(event) ? (
                        <span className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                          Full
                        </span>
                      ) : isEventUpcoming(event) ? (
                        <button
                          onClick={() => handleRegister(event.id)}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                        >
                          Register
                        </button>
                      ) : (
                        <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                          Past Event
                        </span>
                      )}
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <ExternalLink className="w-5 h-5" />
                      </button>
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
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-lg ${
                    currentPage === page
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
