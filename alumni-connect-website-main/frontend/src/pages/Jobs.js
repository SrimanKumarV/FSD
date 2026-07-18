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
  BriefcaseIcon,
  UserPlus
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const JobLogo = ({ logo, company }) => {
  const [error, setError] = useState(false);

  if (!logo || error) {
    return <Building className="w-8 h-8 text-gray-400 dark:text-gray-500" />;
  }

  return (
    <img loading="lazy" 
      src={logo} 
      alt={company} 
      className="w-full h-full object-contain bg-white dark:bg-white/95 p-1" 
      onError={() => setError(true)} 
    />
  );
};

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    q: '',
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
  const [jobSource, setJobSource] = useState('internal'); // 'internal' | 'external'

  useEffect(() => {
    fetchJobs();
  }, [filters, sortBy, currentPage, jobSource]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      if (jobSource === 'internal') {
        const [internalRes, externalRes] = await Promise.all([
          api.get('/jobs', { 
            params: { ...filters, page: currentPage, sort: sortBy } 
          }),
          currentPage === 1 ? api.get('/jobs/external', { 
            params: { category: filters.category, search: filters.q, limit: 50, region: 'india' } 
          }).catch(err => {
            console.error("External jobs fetch failed:", err);
            return { data: { jobs: [] } };
          }) : Promise.resolve({ data: { jobs: [] } })
        ]);

        const internalJobs = internalRes.data?.jobs || internalRes.jobs || [];
        const externalJobs = externalRes.data?.jobs || externalRes.jobs || [];
        
        let combinedJobs = [...internalJobs, ...externalJobs];

        if (sortBy === 'newest') {
          combinedJobs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        } else if (sortBy === 'oldest') {
          combinedJobs.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        } else if (sortBy === 'salary_high') {
          combinedJobs.sort((a, b) => (b.salary?.max || b.salary?.min || 0) - (a.salary?.max || a.salary?.min || 0));
        } else if (sortBy === 'salary_low') {
          combinedJobs.sort((a, b) => (a.salary?.min || a.salary?.max || 0) - (b.salary?.min || b.salary?.max || 0));
        }

        setJobs(combinedJobs);
        setTotalPages(internalRes.data?.pagination?.pages || internalRes.pagination?.pages || 1);
      } else {
        const response = await api.get('/jobs/external', { 
          params: { ...filters, limit: 50, region: 'international' } 
        });
        setJobs(response.data?.jobs || response.jobs || []);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
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
      await api.post(`/jobs/${jobId}/apply`);
      toast.success('Application submitted successfully!');
      fetchJobs(); // refresh applications count
    } catch (error) {
      console.error('Error applying to job:', error);
      toast.error(error.response?.data?.message || 'Failed to apply');
    }
  };

  const handleSave = async (jobId) => {
    try {
      await api.post(`/jobs/${jobId}/save`);
      toast.success('Job saved successfully!');
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error(error.response?.data?.message || 'Failed to save job');
    }
  };

  const handleReferralRequest = (jobId, companyName) => {
    // In a real implementation, this would open a modal to send a message to alumni working at this company
    toast.success(`Referral request sent to alumni network at ${companyName}!`);
  };

  const sortedJobs = jobs; // Backend handles sorting and filtering

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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Opportunities</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                Discover exciting career opportunities from our alumni network
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div whileHover={{ y: -5 }} className="text-center p-6 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl shadow-sm">
              <BriefcaseIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{jobs.length}</p>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">Active Jobs</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="text-center p-6 bg-green-50/50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-2xl shadow-sm">
              <Eye className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{jobs.reduce((sum, job) => sum + (job.views || 0), 0)}</p>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">Total Views</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="text-center p-6 bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800/30 rounded-2xl shadow-sm">
              <Users className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0)}</p>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mt-1">Applications</p>
            </motion.div>
            <motion.div whileHover={{ y: -5 }} className="text-center p-6 bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 rounded-2xl shadow-sm">
              <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{jobs.filter(job => job.isRemote).length}</p>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-1">Remote Jobs</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Sticky Filters Area */}
        <div className="mb-8">
          <div className="max-w-7xl mx-auto">
            {/* Source Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6"
            >
              <button
                onClick={() => setJobSource('internal')}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all duration-300 ${jobSource === 'internal' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-700'}`}
              >
                Jobs and Internships
              </button>
              <button
                onClick={() => setJobSource('external')}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold transition-all duration-300 ${jobSource === 'external' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-700'}`}
              >
                Global Remote Jobs (External)
              </button>
            </motion.div>

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
                placeholder="Search jobs by title, company, or keywords..."
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
              className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Job Type
                  </label>
                  <select
                    value={filters.jobType}
                    onChange={(e) => handleFilterChange('jobType', e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={filters.experience}
                    onChange={(e) => handleFilterChange('experience', e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
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
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Remote Work
                  </label>
                  <select
                    value={filters.isRemote}
                    onChange={(e) => handleFilterChange('isRemote', e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
                  >
                    <option value="">All</option>
                    <option value="true">Remote Only</option>
                    <option value="false">On-site Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City, State, or Country"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Salary Range
                  </label>
                  <select
                    value={filters.salary}
                    onChange={(e) => handleFilterChange('salary', e.target.value)}
                    className="glass-input w-full px-4 py-2.5 rounded-xl focus:outline-none"
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
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedJobs.map((job) => (
              <motion.div
                whileHover={{ y: -5 }}
                key={job._id || job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-6 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-400/20 to-transparent dark:from-primary-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative z-10 flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm">
                      <JobLogo logo={job.companyLogo} company={job.company} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{job.title}</h3>
                      <div className="flex items-center space-x-4 text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                        <span className="flex items-center">
                          <Building className="w-4 h-4 mr-1.5 text-gray-400" />
                          {job.company}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                          {job.location}
                          {job.isRemote && <span className="ml-1 text-primary-500">(Remote)</span>}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getJobTypeColor(job.jobType || 'full-time')}`}>
                          {(job.jobType || 'full-time').replace('-', ' ')}
                        </span>
                        {job.experience && (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getExperienceColor(job.experience)}`}>
                            {job.experience}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSave(job._id || job.id)}
                      className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <p className="relative z-10 text-gray-700 dark:text-gray-300 mb-6 line-clamp-2">{job.description}</p>

                <div className="relative z-10 flex flex-wrap gap-2 mb-6">
                  {(job.skills || job.tags || []).slice(0, 5).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full border border-gray-200/50 dark:border-gray-700/50"
                    >
                      {skill}
                    </span>
                  ))}
                  {(job.skills || job.tags || []).length > 5 && (
                    <span className="px-3 py-1 bg-gray-100/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-full border border-gray-200/50 dark:border-gray-700/50">
                      +{(job.skills || job.tags || []).length - 5} more
                    </span>
                  )}
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {job.salary && (
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1.5" />
                        {job.isExternal && job.salary.currency 
                          ? job.salary.currency 
                          : job.salary.min 
                            ? `$${job.salary.min.toLocaleString()} - $${job.salary.max?.toLocaleString() || '∞'}`
                            : 'Not specified'}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5" />
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    {!job.isExternal && (
                      <>
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1.5" />
                          {job.views || 0} views
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1.5" />
                          {job.applications?.length || 0} applications
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center space-x-3 w-full sm:w-auto mt-4 sm:mt-0">
                    {job.isExternal ? (
                      <a
                        href={job.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-center transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                      >
                        Apply on Site
                      </a>
                    ) : (
                      <>
                        <button
                          onClick={() => handleReferralRequest(job._id || job.id, job.company)}
                          className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                          <UserPlus className="w-4 h-4" /> Request Referral
                        </button>
                        <button
                          onClick={() => handleApply(job._id || job.id)}
                          className="flex-1 sm:flex-none px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        >
                          Apply Now
                        </button>
                      </>
                    )}
                    <button className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-xl transition-colors shadow-sm hover:shadow">
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

export default Jobs;
