import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Award, 
  Clock, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Flag,
  Bookmark,
  Share2,
  MoreVertical,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

const Contests = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });

  // Fetch contests
  const { data: contestsData, isLoading, error } = useQuery(
    ['contests', filters],
    () => api.get('/contests', { params: filters }),
    { keepPreviousData: true }
  );

  // Create contest mutation
  const createContestMutation = useMutation(
    (contestData) => api.post('/contests', contestData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contests']);
        setShowCreateModal(false);
        toast.success('Contest created successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create contest');
      }
    }
  );

  // Join contest mutation
  const joinContestMutation = useMutation(
    (contestId) => api.post(`/contests/${contestId}/join`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['contests']);
        toast.success('Successfully joined the contest!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to join contest');
      }
    }
  );

  const handleCreateContest = (contestData) => {
    createContestMutation.mutate(contestData);
  };

  const handleJoinContest = (contestId) => {
    joinContestMutation.mutate(contestId);
  };

  const categories = [
    { value: 'coding', label: 'Coding Challenge', color: 'bg-blue-100 text-blue-800' },
    { value: 'design', label: 'Design Contest', color: 'bg-purple-100 text-purple-800' },
    { value: 'business', label: 'Business Plan', color: 'bg-green-100 text-green-800' },
    { value: 'writing', label: 'Writing Contest', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'photography', label: 'Photography', color: 'bg-pink-100 text-pink-800' },
    { value: 'video', label: 'Video Contest', color: 'bg-red-100 text-red-800' },
    { value: 'innovation', label: 'Innovation', color: 'bg-indigo-100 text-indigo-800' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'judging':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-4 h-4" />;
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'judging':
        return <Pause className="w-4 h-4" />;
      case 'completed':
        return <StopCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg">Error loading contests</div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contests & Challenges</h1>
          <p className="mt-2 text-gray-600">Compete, showcase your skills, and win exciting prizes</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Contest
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search contests..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="judging">Judging</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Contests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))
        ) : contestsData?.contests?.length > 0 ? (
          contestsData.contests.map((contest) => (
            <ContestCard
              key={contest._id}
              contest={contest}
              onJoin={handleJoinContest}
              onSelect={setSelectedContest}
              user={user}
              getStatusColor={getStatusColor}
              getStatusIcon={getStatusIcon}
              categories={categories}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contests found</h3>
            <p className="text-gray-600 mb-4">Check back later for exciting new challenges!</p>
          </div>
        )}
      </div>

      {/* Create Contest Modal */}
      {showCreateModal && (
        <CreateContestModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateContest}
          categories={categories}
        />
      )}

      {/* Contest Detail Modal */}
      {selectedContest && (
        <ContestDetailModal
          contest={selectedContest}
          onClose={() => setSelectedContest(null)}
          onJoin={handleJoinContest}
          user={user}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
        />
      )}
    </div>
  );
};

// Contest Card Component
const ContestCard = ({ contest, onJoin, onSelect, user, getStatusColor, getStatusIcon, categories }) => {
  const [showActions, setShowActions] = useState(false);

  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : 'bg-gray-100 text-gray-800';
  };

  const isJoined = contest.participants?.includes(user?.id);
  const canJoin = contest.status === 'active' && !isJoined && contest.participants?.length < contest.maxParticipants;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(contest)}
    >
      {/* Contest Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600">
            {contest.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {contest.description}
          </p>
        </div>
        
        {/* Actions */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                <Bookmark className="w-4 h-4 mr-2" />
                Bookmark
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                <Flag className="w-4 h-4 mr-2" />
                Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contest.status)}`}>
          {getStatusIcon(contest.status)}
          <span className="ml-1 capitalize">{contest.status}</span>
        </span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(contest.category)}`}>
          {categories.find(c => c.value === contest.category)?.label}
        </span>
      </div>

      {/* Contest Info */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>
            {new Date(contest.startDate).toLocaleDateString()} - {new Date(contest.endDate).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Users className="w-4 h-4 mr-2" />
          <span>{contest.participants?.length || 0} / {contest.maxParticipants} participants</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Award className="w-4 h-4 mr-2" />
          <span>Prize: ${contest.prizeAmount}</span>
        </div>
      </div>

      {/* Join Button */}
      <div className="flex justify-between items-center">
        {contest.status === 'active' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (canJoin) {
                onJoin(contest._id);
              }
            }}
            disabled={!canJoin}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              canJoin
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : isJoined
                ? 'bg-green-100 text-green-800 cursor-default'
                : 'bg-gray-100 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isJoined ? (
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                Joined
              </span>
            ) : canJoin ? (
              'Join Contest'
            ) : (
              'Full'
            )}
          </button>
        )}
        
        {contest.status === 'upcoming' && (
          <span className="text-sm text-blue-600 font-medium">Coming Soon</span>
        )}
        
        {contest.status === 'judging' && (
          <span className="text-sm text-yellow-600 font-medium">Judging in Progress</span>
        )}
        
        {contest.status === 'completed' && (
          <span className="text-sm text-gray-600 font-medium">Completed</span>
        )}
      </div>
    </motion.div>
  );
};

// Create Contest Modal Component
const CreateContestModal = ({ onClose, onSubmit, categories }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
    prizeAmount: '',
    rules: '',
    criteria: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Contest</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contest Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter contest title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the contest..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
              <input
                type="number"
                required
                min="1"
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="datetime-local"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prize Amount ($)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.prizeAmount}
              onChange={(e) => setFormData({ ...formData, prizeAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="1000.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rules & Guidelines</label>
            <textarea
              rows={4}
              value={formData.rules}
              onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter contest rules and guidelines..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Judging Criteria</label>
            <textarea
              rows={3}
              value={formData.criteria}
              onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter judging criteria..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create Contest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Contest Detail Modal Component
const ContestDetailModal = ({ contest, onClose, onJoin, user, getStatusColor, getStatusIcon }) => {
  const isJoined = contest.participants?.includes(user?.id);
  const canJoin = contest.status === 'active' && !isJoined && contest.participants?.length < contest.maxParticipants;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{contest.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Contest Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Contest Details</h3>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-3" />
                  <span>
                    <strong>Start:</strong> {new Date(contest.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-3" />
                  <span>
                    <strong>End:</strong> {new Date(contest.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-3" />
                  <span>
                    <strong>Participants:</strong> {contest.participants?.length || 0} / {contest.maxParticipants}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Award className="w-4 h-4 mr-3" />
                  <span>
                    <strong>Prize:</strong> ${contest.prizeAmount}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Status & Category</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contest.status)}`}>
                    {getStatusIcon(contest.status)}
                    <span className="ml-2 capitalize">{contest.status}</span>
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Category:</strong> {contest.category}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 leading-relaxed">{contest.description}</p>
          </div>

          {/* Rules */}
          {contest.rules && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Rules & Guidelines</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-line">{contest.rules}</p>
              </div>
            </div>
          )}

          {/* Judging Criteria */}
          {contest.criteria && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Judging Criteria</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-line">{contest.criteria}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center pt-4">
            {contest.status === 'active' && (
              <button
                onClick={() => {
                  if (canJoin) {
                    onJoin(contest._id);
                    onClose();
                  }
                }}
                disabled={!canJoin}
                className={`px-6 py-3 rounded-lg text-lg font-medium transition-colors ${
                  canJoin
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : isJoined
                    ? 'bg-green-100 text-green-800 cursor-default'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isJoined ? (
                  <span className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Already Joined
                  </span>
                ) : canJoin ? (
                  'Join Contest Now'
                ) : (
                  'Contest Full'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contests;
