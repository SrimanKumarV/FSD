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
      // TODO: Replace with actual API call
      const mockMentors = [
        {
          id: 1,
          name: 'Dr. Sarah Johnson',
          photo: null,
          role: 'alumni',
          bio: 'Senior Software Engineer with 8+ years of experience in full-stack development and cloud architecture.',
          skills: ['React', 'Node.js', 'AWS', 'Python', 'Machine Learning'],
          location: 'San Francisco, CA',
          alumniInfo: {
            company: 'Google',
            position: 'Senior Software Engineer',
            industry: 'Technology',
            experience: 8
          },
          status: 'available',
          rating: 4.8,
          menteeCount: 12
        },
        {
          id: 2,
          name: 'Michael Chen',
          photo: null,
          role: 'alumni',
          bio: 'Product Manager with expertise in B2B SaaS and startup growth strategies.',
          skills: ['Product Management', 'Strategy', 'Analytics', 'Leadership'],
          location: 'New York, NY',
          alumniInfo: {
            company: 'Microsoft',
            position: 'Senior Product Manager',
            industry: 'Technology',
            experience: 6
          },
          status: 'available',
          rating: 4.9,
          menteeCount: 8
        }
      ];
      setMentors(mockMentors);
    } catch (error) {
      console.error('Error fetching mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentorships = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockMentorships = [
        {
          id: 1,
          title: 'Career Transition to Tech',
          status: 'active',
          mentor: { name: 'Dr. Sarah Johnson', photo: null },
          student: { name: user?.name, photo: null },
          startDate: '2024-01-15',
          expectedDuration: '6-12 months',
          focusAreas: ['Web Development', 'Career Planning'],
          goals: ['Learn full-stack development', 'Build portfolio projects']
        }
      ];
      setMentorships(mockMentorships);
    } catch (error) {
      console.error('Error fetching mentorships:', error);
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

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      console.log('Submitting mentorship request:', requestForm);
      setShowRequestForm(false);
      setRequestForm({
        mentorId: '',
        title: '',
        description: '',
        focusAreas: [],
        goals: [],
        expectedDuration: '',
        communicationMethod: ''
      });
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
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
              <h1 className="text-3xl font-bold text-gray-900">Mentorship</h1>
              <p className="text-gray-600 mt-2">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{mentors.length}</p>
              <p className="text-sm text-blue-600">Available Mentors</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{mentorships.filter(m => m.status === 'active').length}</p>
              <p className="text-sm text-green-600">Active Mentorships</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{mentorships.filter(m => m.status === 'pending').length}</p>
              <p className="text-sm text-yellow-600">Pending Requests</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{mentorships.filter(m => m.status === 'completed').length}</p>
              <p className="text-sm text-purple-600">Completed</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('find')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'find'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Find Mentors
              </button>
              <button
                onClick={() => setActiveTab('my-mentorships')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-mentorships'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search mentors by skills, industry, or location..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={filters.skills}
                    onChange={(e) => handleFilterChange('skills', e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry
                      </label>
                      <select
                        value={filters.industry}
                        onChange={(e) => handleFilterChange('industry', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">All Industries</option>
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        placeholder="City, State"
                        value={filters.location}
                        onChange={(e) => handleFilterChange('location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Availability
                      </label>
                      <select
                        value={filters.availability}
                        onChange={(e) => handleFilterChange('availability', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentors.map((mentor) => (
                  <motion.div
                    key={mentor.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start space-x-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {mentor.photo ? (
                          <img src={mentor.photo} alt={mentor.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{mentor.name}</h3>
                        <p className="text-sm text-gray-600">{mentor.alumniInfo.position}</p>
                        <p className="text-sm text-gray-600">{mentor.alumniInfo.company}</p>
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">{mentor.bio}</p>

                    <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
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

                    <div className="flex flex-wrap gap-2 mb-4">
                      {mentor.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {mentor.skills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          +{mentor.skills.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        mentor.status === 'available' 
                          ? 'text-green-600 bg-green-100' 
                          : 'text-gray-600 bg-gray-100'
                      }`}>
                        {mentor.status === 'available' ? 'Available' : 'Busy'}
                      </span>
                      <button
                        onClick={() => {
                          setRequestForm(prev => ({ ...prev, mentorId: mentor.id }));
                          setShowRequestForm(true);
                        }}
                        className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
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
                  <div key={mentorship.id} className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{mentorship.title}</h3>
                        <p className="text-sm text-gray-600">
                          Mentor: {mentorship.mentor.name}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(mentorship.status)}`}>
                        {mentorship.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Focus Areas</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {mentorship.focusAreas.map((area, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Goals</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {mentorship.goals.map((goal, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              {goal}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
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
                      <button
                        onClick={() => navigate('/chat')}
                        className="flex items-center px-3 py-1 text-primary hover:bg-primary hover:text-white rounded transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Message
                      </button>
                    </div>
                  </div>
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

        {/* Mentorship Request Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Request Mentorship</h2>
                  <button
                    onClick={() => setShowRequestForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleRequestSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mentor
                    </label>
                    <select
                      value={requestForm.mentorId}
                      onChange={(e) => setRequestForm(prev => ({ ...prev, mentorId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      <option value="">Select a mentor</option>
                      {mentors.map(mentor => (
                        <option key={mentor.id} value={mentor.id}>
                          {mentor.name} - {mentor.alumniInfo.position} at {mentor.alumniInfo.company}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={requestForm.title}
                      onChange={(e) => setRequestForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="e.g., Career Transition to Tech"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={requestForm.description}
                      onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Describe what you're looking to achieve through mentorship..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Duration
                      </label>
                      <select
                        value={requestForm.expectedDuration}
                        onChange={(e) => setRequestForm(prev => ({ ...prev, expectedDuration: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      >
                        <option value="">Select duration</option>
                        <option value="1-3 months">1-3 months</option>
                        <option value="3-6 months">3-6 months</option>
                        <option value="6-12 months">6-12 months</option>
                        <option value="1+ years">1+ years</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Communication Method
                      </label>
                      <select
                        value={requestForm.communicationMethod}
                        onChange={(e) => setRequestForm(prev => ({ ...prev, communicationMethod: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      >
                        <option value="">Select method</option>
                        <option value="email">Email</option>
                        <option value="video_call">Video Call</option>
                        <option value="chat">Chat</option>
                        <option value="in_person">In Person</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mentorship;
