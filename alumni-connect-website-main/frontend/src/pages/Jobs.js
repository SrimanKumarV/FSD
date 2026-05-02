import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  Briefcase, 
  Building, 
  DollarSign,
  Calendar,
  Clock,
  Bookmark,
  ExternalLink,
  Plus,
  Eye,
  Users,
  TrendingUp,
  BriefcaseIcon
} from 'lucide-react';

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    location: '',
    jobType: '',
    isRemote: '',
    experience: '',
    salary: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchJobs();
  }, [filters, sortBy, currentPage]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockJobs = [
        {
          id: 1,
          title: 'Senior Software Engineer',
          company: 'Google',
          companyLogo: null,
          location: 'San Francisco, CA',
          isRemote: false,
          jobType: 'full-time',
          category: 'technology',
          experience: 'senior',
          salary: { min: 150000, max: 250000 },
          description: 'We are looking for a Senior Software Engineer to join our team...',
          skills: ['React', 'Node.js', 'Python', 'AWS'],
          postedBy: { name: 'John Doe', photo: null },
          createdAt: '2024-01-15',
          views: 245,
          applications: 18,
          status: 'active'
        },
        {
          id: 2,
          title: 'Product Manager',
          company: 'Microsoft',
          companyLogo: null,
          location: 'Seattle, WA',
          isRemote: true,
          jobType: 'full-time',
          category: 'technology',
          experience: 'mid',
          salary: { min: 120000, max: 180000 },
          description: 'Join our product team to help shape the future of cloud computing...',
          skills: ['Product Management', 'Analytics', 'Leadership'],
          postedBy: { name: 'Jane Smith', photo: null },
          createdAt: '2024-01-14',
          views: 189,
          applications: 12,
          status: 'active'
        }
      ];
      setJobs(mockJobs);
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching jobs:', error);
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

  const handleApply = async (jobId) => {
    try {
      // TODO: Replace with actual API call
      console.log('Applying to job:', jobId);
    } catch (error) {
      console.error('Error applying to job:', error);
    }
  };

  const handleSave = async (jobId) => {
    try {
      // TODO: Replace with actual API call
      console.log('Saving job:', jobId);
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filters.search && !job.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !job.company.toLowerCase().includes(filters.search.toLowerCase()) &&
        !job.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.category && job.category !== filters.category) return false;
    if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.jobType && job.jobType !== filters.jobType) return false;
    if (filters.isRemote !== '' && job.isRemote !== (filters.isRemote === 'true')) return false;
    if (filters.experience && job.experience !== filters.experience) return false;
    if (filters.salary) {
      const [min, max] = filters.salary.split('-').map(s => parseInt(s));
      if (min && job.salary.max < min) return false;
      if (max && job.salary.min > max) return false;
    }
    return true;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'salary_high':
        return b.salary.max - a.salary.max;
      case 'salary_low':
        return a.salary.min - b.salary.min;
      case 'popular':
        return b.views - a.views;
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  const getExperienceColor = (experience) => {
    switch (experience) {
      case 'entry': return 'text-green-600 bg-green-100';
      case 'junior': return 'text-blue-600 bg-blue-100';
      case 'mid': return 'text-yellow-600 bg-yellow-100';
      case 'senior': return 'text-purple-600 bg-purple-100';
      case 'lead': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getJobTypeColor = (jobType) => {
    switch (jobType) {
      case 'full-time': return 'text-green-600 bg-green-100';
      case 'part-time': return 'text-blue-600 bg-blue-100';
      case 'contract': return 'text-yellow-600 bg-yellow-100';
      case 'internship': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Job Opportunities</h1>
              <p className="text-gray-600 mt-2">
                Discover exciting career opportunities from our alumni network
              </p>
            </div>
            {user?.role === 'alumni' && (
              <button
                onClick={() => setShowPostForm(true)}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Post a Job
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <BriefcaseIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{jobs.length}</p>
              <p className="text-sm text-blue-600">Active Jobs</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Eye className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{jobs.reduce((sum, job) => sum + job.views, 0)}</p>
              <p className="text-sm text-green-600">Total Views</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Users className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{jobs.reduce((sum, job) => sum + job.applications, 0)}</p>
              <p className="text-sm text-yellow-600">Applications</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{jobs.filter(job => job.isRemote).length}</p>
              <p className="text-sm text-purple-600">Remote Jobs</p>
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
                placeholder="Search jobs by title, company, or keywords..."
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
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="salary_high">Highest Salary</option>
              <option value="salary_low">Lowest Salary</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type
                  </label>
                  <select
                    value={filters.jobType}
                    onChange={(e) => handleFilterChange('jobType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={filters.experience}
                    onChange={(e) => handleFilterChange('experience', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Levels</option>
                    <option value="entry">Entry Level</option>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remote Work
                  </label>
                  <select
                    value={filters.isRemote}
                    onChange={(e) => handleFilterChange('isRemote', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All</option>
                    <option value="true">Remote Only</option>
                    <option value="false">On-site Only</option>
                  </select>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Range
                  </label>
                  <select
                    value={filters.salary}
                    onChange={(e) => handleFilterChange('salary', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">All Salaries</option>
                    <option value="0-50000">$0 - $50k</option>
                    <option value="50000-100000">$50k - $100k</option>
                    <option value="100000-150000">$100k - $150k</option>
                    <option value="150000-200000">$150k - $200k</option>
                    <option value="200000-">$200k+</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                      ) : (
                        <Building className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          {job.company}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                          {job.isRemote && <span className="ml-1 text-primary">(Remote)</span>}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getJobTypeColor(job.jobType)}`}>
                          {job.jobType.replace('-', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getExperienceColor(job.experience)}`}>
                          {job.experience}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSave(job.id)}
                      className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.skills.slice(0, 5).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 5 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      +{job.skills.length - 5} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" />
                      ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {job.views} views
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {job.applications} applications
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleApply(job.id)}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Apply Now
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {sortedJobs.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
              </div>
            )}
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

export default Jobs;
