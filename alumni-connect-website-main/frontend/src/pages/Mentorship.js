import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  User, 
  MapPin, 
  Briefcase, 
  Star, 
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Users,
  Target,
  BookOpen
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const Mentorship = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('find');
  const [mentors, setMentors] = useState([]);
  const [mentorships, setMentorships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    skills: '',
    industry: '',
    location: '',
    availability: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    mentorId: '',
    title: '',
    description: '',
    focusAreas: [],
    goals: [],
    expectedDuration: '',
    communicationMethod: ''
  });

  useEffect(() => {
    if (activeTab === 'find') {
      fetchMentors();
    } else {
      fetchMentorships();
    }
  }, [activeTab, filters]);

  const fetchMentors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/mentorship/mentors', { params: filters });
      setMentors(response.data?.mentors || response.mentors || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast.error('Failed to fetch mentors');
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorships = async () => {
    setLoading(true);
    try {
      const response = await api.get('/mentorship');
      setMentorships(response.data?.mentorships || response.mentorships || []);
    } catch (error) {
      console.error('Error fetching mentorships:', error);
      toast.error('Failed to fetch mentorships');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleQuickRequest = async (mentor) => {
    setLoading(true);
    try {
      const submitData = {
        mentorId: mentor._id || mentor.id,
        title: `Mentorship Request from ${user.name}`,
        description: 'I would like to request mentorship from you to help guide my career and skills.',
        focusAreas: ['General Mentorship'],
        goals: ['Career Guidance'],
        expectedDuration: '1-3 months',
        communicationMethod: 'chat'
      };
      
      await api.post('/mentorship', submitData);
      toast.success('Mentorship request sent successfully!');
      if (activeTab === 'my-mentorships') fetchMentorships();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (mentorshipId, newStatus) => {
    setLoading(true);
    try {
      await api.put(`/mentorship/${mentorshipId}/status`, { status: newStatus });
      toast.success(`Mentorship request ${newStatus}`);
      if (activeTab === 'my-mentorships') fetchMentorships();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredMentors = mentors.filter(mentor => {
    if (filters.skills && !mentor.skills.some(skill => 
      skill.toLowerCase().includes(filters.skills.toLowerCase())
    )) return false;
    if (filters.industry && mentor.alumniInfo.industry !== filters.industry) return false;
    if (filters.location && !mentor.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.availability === 'available' && mentor.status !== 'available') return false;
    return true;
  });

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentorship Hub</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                Connect with experienced alumni mentors to accelerate your career growth
              </p>
            </div>
            {user?.role === 'student' && (
              <button
                onClick={() => setShowRequestForm(true)}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Request Mentorship
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div whileHover={{ y: -5 }} className="text-center p-6 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl shadow-sm">
              <Users className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{mentors.length}</p>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">Available Mentors</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="text-center p-6 bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-2xl shadow-sm">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{mentorships.filter(m => m.status === 'active').length}</p>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">Active Mentorships</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="text-center p-6 bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-2xl shadow-sm">
              <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{mentorships.filter(m => m.status === 'pending').length}</p>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mt-1">Pending Requests</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="text-center p-6 bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 rounded-2xl shadow-sm">
              <Target className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{mentorships.filter(m => m.status === 'completed').length}</p>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-1">Completed</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="glass-card rounded-2xl mb-8 overflow-hidden">
          <div className="border-b border-gray-200/50 dark:border-gray-700/50">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('find')}
                className={`py-4 px-6 border-b-2 font-bold text-sm transition-all duration-300 ${
                  activeTab === 'find'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                Find Mentors
              </button>
              <button
                onClick={() => setActiveTab('my-mentorships')}
                className={`py-4 px-6 border-b-2 font-bold text-sm transition-all duration-300 ${
                  activeTab === 'my-mentorships'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/50 dark:bg-primary-900/20'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                My Mentorships
              </button>
            </nav>
          </div>
        </div>

        {/* Find Mentors Tab */}
        {activeTab === 'find' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search mentors by skills, industry, or location..."
                    className="glass-input w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none"
                    value={filters.skills}
                    onChange={(e) => handleFilterChange('skills', e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center px-6 py-3 glass-card rounded-xl hover:bg-white/90 dark:hover:bg-gray-700/80 transition-all font-semibold text-gray-700 dark:text-gray-200"
                >
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </button>
              </div>

              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Industry
                      </label>
                      <select
                        value={filters.industry}
                        onChange={(e) => handleFilterChange('industry', e.target.value)}
                        className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
                      >
                        <option value="">All Industries</option>
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        placeholder="City, State"
                        value={filters.location}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                        className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Availability
                      </label>
                      <select
                        value={filters.availability}
                        onChange={(e) => handleFilterChange('availability', e.target.value)}
                        className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
                      >
                        <option value="all">All Mentors</option>
                        <option value="available">Available Now</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Mentors Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentors.map((mentor) => (
                  <motion.div
                    whileHover={{ y: -5 }}
                    key={mentor.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card rounded-2xl p-6 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-400/20 to-transparent dark:from-primary-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="relative z-10 flex items-start space-x-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm">
                        {mentor.photo ? (
                          <img src={mentor.photo} alt={mentor.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-tr from-primary-500 to-alumni-500 text-white font-bold text-2xl flex items-center justify-center">
                            {mentor.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{mentor.name}</h3>
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{mentor.alumniInfo.position}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{mentor.alumniInfo.company}</p>
                      </div>
                    </div>

                    <p className="relative z-10 text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3">{mentor.bio}</p>

                    <div className="relative z-10 flex items-center space-x-4 mb-5 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {mentor.location}
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        {mentor.rating}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {mentor.menteeCount} mentees
                      </div>
                    </div>

                    <div className="relative z-10 flex flex-wrap gap-2 mb-6">
                      {mentor.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full border border-gray-200/50 dark:border-gray-700/50"
                        >
                          {skill}
                        </span>
                      ))}
                      {mentor.skills.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full border border-gray-200/50 dark:border-gray-700/50">
                          +{mentor.skills.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="relative z-10 flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        mentor.status === 'available' 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-gray-600 bg-gray-100'
                      }`}>
                        {mentor.status === 'available' ? 'Available' : 'Busy'}
                      </span>
                      <button
                        onClick={() => handleQuickRequest(mentor)}
                        disabled={loading}
                        className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                      >
                        Request Mentorship
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {filteredMentors.length === 0 && !loading && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors found</h3>
                <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* My Mentorships Tab */}
        {activeTab === 'my-mentorships' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : mentorships.length > 0 ? (
              <div className="space-y-4">
                {mentorships.map((mentorship) => (
                  <motion.div whileHover={{ y: -5 }} key={mentorship.id} className="glass-card rounded-2xl p-6 group">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{mentorship.title}</h3>
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1 flex items-center space-x-2">
                          {user.role === 'alumni' ? (
                            <>
                              {mentorship.student?.photo ? (
                                <img src={mentorship.student.photo} alt={mentorship.student.name} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <span className="w-6 h-6 bg-gradient-to-r from-primary-500 to-alumni-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {mentorship.student?.name?.charAt(0)?.toUpperCase()}
                                </span>
                              )}
                              <span>Student: {mentorship.student?.name || 'Unknown User'}</span>
                            </>
                          ) : (
                            <>
                              {mentorship.mentor?.photo ? (
                                <img src={mentorship.mentor.photo} alt={mentorship.mentor.name} className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <span className="w-6 h-6 bg-gradient-to-r from-primary-500 to-alumni-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {mentorship.mentor?.name?.charAt(0)?.toUpperCase()}
                                </span>
                              )}
                              <span>Mentor: {mentorship.mentor?.name || 'Unknown User'}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm capitalize ${getStatusColor(mentorship.status)}`}>
                        {mentorship.status === 'accepted' ? 'Approved' : mentorship.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Focus Areas</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {mentorship.focusAreas.map((area, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full border border-blue-200/50 dark:border-blue-800/50">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Goals</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {mentorship.goals.map((goal, index) => (
                            <span key={index} className="px-3 py-1 bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full border border-green-200/50 dark:border-green-800/50">
                              {goal}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Started {new Date(mentorship.startDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {mentorship.expectedDuration}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.role === 'alumni' && mentorship.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(mentorship._id || mentorship.id, 'accepted')}
                              className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors duration-300"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Accept
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(mentorship._id || mentorship.id, 'rejected')}
                              className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors duration-300"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Decline
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => navigate('/chat')}
                          className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 font-semibold rounded-xl transition-colors duration-300"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No mentorships yet</h3>
                <p className="text-gray-600 mb-4">
                  Start your mentorship journey by finding a mentor who can guide you.
                </p>
                <button
                  onClick={() => setActiveTab('find')}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Find Mentors
                </button>
              </div>
            )}
          </motion.div>
        )}


      </div>
    </div>
  );
};

export default Mentorship;
