import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, MapPin, Building, Building2, Calendar, Clock, DollarSign, Filter, Search, ChevronDown, CheckCircle2, ChevronRight, Share2, BookOpen, Plus, Eye, Users, TrendingUp, BriefcaseIcon, UserPlus, Bookmark, ExternalLink, Edit3, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const JobLogo = ({ logo, company }) => {
  const [error, setError] = useState(false);

  if (!logo || error) {
    return <Building2 className="w-8 h-8 text-gray-500 dark:text-gray-500" />;
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

const MyPostedJobs = ({ onSelectJob }) => {
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyJobs = async () => {
      try {
        const res = await api.get('/jobs/my-posts');
        setMyJobs(res.data?.jobs || []);
      } catch (err) {
        console.error('Failed to fetch my posted jobs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyJobs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (myJobs.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center h-[500px] flex flex-col items-center justify-center border-dashed border-2 border-gray-200 dark:border-gray-700">
        <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You haven't posted any jobs yet</h3>
        <p className="text-gray-500 dark:text-gray-400">Share opportunities with the alumni network!</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl max-h-[80vh] overflow-y-auto custom-scrollbar">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 sticky top-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur p-2 rounded-lg z-10 border-b border-gray-100 dark:border-gray-700">
        My Posted Jobs & Referrals
      </h3>
      <div className="space-y-4">
        {myJobs.map(job => (
          <div key={job._id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-primary-500 transition-colors bg-gray-50 dark:bg-gray-800/50 cursor-pointer" onClick={() => onSelectJob(job)}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{job.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{job.company}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${job.jobType === 'referral' ? 'bg-amber-100 text-amber-700' : 'bg-primary-100 text-primary-700'}`}>
                {job.jobType}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
              <span className="flex items-center"><Users className="w-4 h-4 mr-1"/> {job.applications?.length || 0} Apps</span>
              <span className="flex items-center"><Eye className="w-4 h-4 mr-1"/> {job.views || 0} Views</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${job.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                {job.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PostJobModal = ({ onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    company: initialData?.company || '',
    location: initialData?.location || '',
    jobType: initialData?.jobType || 'full-time',
    category: initialData?.category || 'technology',
    isRemote: initialData?.isRemote || false,
    requirements: initialData?.requirements?.length ? initialData.requirements : [''],
    skills: initialData?.skills?.length ? initialData.skills : [''],
    experience: initialData?.experience || 'entry',
    applicationLink: initialData?.applicationLink || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim() !== ''),
        skills: formData.skills.filter(s => s.trim() !== '')
      };
      if (initialData && initialData._id) {
        await api.put(`/jobs/${initialData._id}`, payload);
        toast.success('Job updated successfully!');
      } else {
        await api.post('/jobs', payload);
        toast.success('Job posted successfully!');
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  const handleArrayChange = (field, index, value) => {
    const newArr = [...formData[field]];
    newArr[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArr }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={initialData ? "Edit Job or Referral" : "Post a Job or Referral"} className="!p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
              <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.title} onChange={e => setFormData(prev => ({...prev, title: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Company</label>
              <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.company} onChange={e => setFormData(prev => ({...prev, company: e.target.value}))} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.location} onChange={e => setFormData(prev => ({...prev, location: e.target.value}))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Job Type</label>
              <select className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.jobType} onChange={e => setFormData(prev => ({...prev, jobType: e.target.value}))}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
                <option value="referral">Referral</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Experience</label>
              <select className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.experience} onChange={e => setFormData(prev => ({...prev, experience: e.target.value}))}>
                <option value="entry">Entry Level</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.category} onChange={e => setFormData(prev => ({...prev, category: e.target.value}))}>
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="finance">Finance</option>
              <option value="marketing">Marketing</option>
              <option value="design">Design</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={formData.isRemote} onChange={e => setFormData(prev => ({...prev, isRemote: e.target.checked}))} className="rounded text-primary-600 focus:ring-primary-500" />
              <span>Is Remote?</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea required rows="4" maxLength={500} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.description} onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}></textarea>
            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.description.length} / 500
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Application Link</label>
            <input required type="url" placeholder="https://" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.applicationLink} onChange={e => setFormData(prev => ({...prev, applicationLink: e.target.value}))} />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Skills</label>
            {formData.skills.map((skill, index) => (
              <input key={index} type="text" placeholder="Skill" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2 text-black dark:text-white" value={skill} onChange={(e) => handleArrayChange('skills', index, e.target.value)} />
            ))}
            <button type="button" onClick={() => addArrayItem('skills')} className="text-sm text-primary-600 hover:text-primary-700 font-semibold">+ Add Skill</button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Requirements</label>
            {formData.requirements.map((req, index) => (
              <input key={index} type="text" placeholder="Requirement" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2 text-black dark:text-white" value={req} onChange={(e) => handleArrayChange('requirements', index, e.target.value)} />
            ))}
            <button type="button" onClick={() => addArrayItem('requirements')} className="text-sm text-primary-600 hover:text-primary-700 font-semibold">+ Add Requirement</button>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="button" onClick={onClose} className="px-6 py-2 mr-4 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 font-semibold">Cancel</button>
            <Button variant="primary" type="submit" disabled={loading} className="px-6 py-2">
              {loading ? (initialData ? 'Updating...' : 'Posting...') : (initialData ? 'Update Job' : 'Post Job')}
            </Button>
          </div>
        </form>
    </Modal>
  );
};

const ApplyJobModal = ({ job, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    coverLetter: '',
    resumeLink: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/jobs/${job._id || job.id}/apply`, formData);
      toast.success('Successfully applied for this job!');
      onSuccess(job._id || job.id);
    } catch (error) {
      console.error('Error applying:', error);
      toast.error(error.response?.data?.message || 'Failed to apply for job');
    } finally {
      setLoading(false);
    }
  };

  const handleParseResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append('resume', file);
    try {
      const res = await api.post('/jobs/parse-resume', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data;
      setFormData(prev => ({
        ...prev,
        coverLetter: `Hi, I am ${data.name || 'a professional'}.\n\nSkills: ${data.skills ? data.skills.join(', ') : 'N/A'}\n\nExperience: ${data.experience || 'N/A'}\n\nEducation: ${data.education || 'N/A'}\n\nBased on my background, I believe I am a strong fit for this position at ${job.company}.`
      }));
      toast.success('Resume parsed and cover letter auto-filled!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Apply for ${job.title}`} className="max-w-lg !p-8">
      <p className="text-gray-500 dark:text-gray-400 mb-6">{job.company}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Autofill Cover Letter from Resume</label>
            <input type="file" accept="application/pdf" onChange={handleParseResume} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-gray-800 dark:file:text-gray-300" />
            <p className="text-xs text-gray-500 mt-1">Upload a PDF resume to generate a draft cover letter using AI.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Resume Link (Optional)</label>
            <input type="url" placeholder="https://link-to-resume.com" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.resumeLink} onChange={e => setFormData(prev => ({...prev, resumeLink: e.target.value}))} />
            <p className="text-xs text-gray-500 mt-1">Provide a link to your Google Drive or Portfolio resume.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cover Letter / Note</label>
            <textarea rows="5" placeholder="Why are you a good fit for this role?" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white custom-scrollbar" value={formData.coverLetter} onChange={e => setFormData(prev => ({...prev, coverLetter: e.target.value}))}></textarea>
          </div>
          <div className="pt-4 flex justify-end">
            <button type="button" onClick={onClose} className="px-6 py-2 mr-4 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 font-semibold">Cancel</button>
            <Button variant="primary" type="submit" disabled={loading} className="px-6 py-2">
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
    </Modal>
  );
};

const DefaultJobs = () => {
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
  const [showPostModal, setShowPostModal] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [jobSource, setJobSource] = useState('internal'); // 'internal' | 'external'
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  
  // Track actions to update UI
  const [requestedReferrals, setRequestedReferrals] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(null); // stores the job being applied to
  const { socket } = useSocket();

  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Socket.io Real-time integration for new jobs
  useEffect(() => {
    setMatchResult(null);
    setIsDescExpanded(false);
  }, [selectedJob]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewJob = (newJob) => {
      setJobs(prev => [newJob, ...prev]);
      toast.success(`New job posted: ${newJob.title} at ${newJob.company}`, { icon: '💼' });
    };
    
    const handleJobDeleted = ({ jobId }) => {
      setJobs(prev => prev.filter(j => j._id !== jobId));
      if (selectedJob && selectedJob._id === jobId) setSelectedJob(null);
    };

    socket.on('job:new', handleNewJob);
    socket.on('job:deleted', handleJobDeleted);
    
    return () => {
      socket.off('job:new', handleNewJob);
      socket.off('job:deleted', handleJobDeleted);
    };
  }, [socket, selectedJob]);

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

  const handleCalculateMatch = async () => {
    if (!selectedJob || !user) return;
    setMatchLoading(true);
    try {
      const payload = {
        jobDescription: selectedJob.description,
        studentSkills: user.skills?.join(', ') || 'None listed',
        studentExperience: user.bio || 'None listed'
      };
      const response = await api.post('/ai/match-job', payload);
      setMatchResult(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to calculate match score');
    } finally {
      setMatchLoading(false);
    }
  };

  const handleApply = (job) => {
    setShowApplyModal(job);
  };

  const handleSave = async (jobId) => {
    // External jobs can't be saved (they have ext_ prefix IDs)
    if (!jobId || String(jobId).startsWith('ext_')) {
      toast.error('External jobs cannot be saved. Apply directly on the external site.');
      return;
    }
    try {
      await api.post(`/jobs/${jobId}/save`);
      toast.success('Job saved successfully!');
      setSavedJobs([...savedJobs, jobId]);
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error(error.response?.data?.message || 'Failed to save job');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      toast.success('Job deleted successfully');
      setJobs(jobs.filter(j => (j._id || j.id) !== jobId));
      if (selectedJob && (selectedJob._id || selectedJob.id) === jobId) {
        setSelectedJob(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job');
    }
  };

  const handleReferralRequest = (jobId, companyName, postedBy) => {
    if (!postedBy || !postedBy._id) {
      toast.error('Cannot find the alumni who posted this.');
      return;
    }
    
    if (socket) {
      socket.emit('message:send', {
        receiverId: postedBy._id,
        content: `Hi! I saw your referral opportunity for ${companyName} and I'm very interested. Could we discuss this?`,
        messageType: 'text'
      });
      setRequestedReferrals([...requestedReferrals, jobId]);
      toast.success(`Referral request sent as a direct message to ${postedBy.name}!`);
    } else {
      toast.error('Chat connection not available.');
    }
  };

  const sortedJobs = jobs; // Backend handles sorting and filtering

  const getJobTypeColor = (jobType) => {
    switch (jobType) {
      case 'full-time': return 'text-green-600 bg-green-100';
      case 'part-time': return 'text-blue-600 bg-blue-100';
      case 'contract': return 'text-yellow-600 bg-yellow-100';
      case 'internship': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDeadlineColor = (dateStr) => {
    if (!dateStr) return 'text-gray-500 bg-gray-500/10';
    const daysOld = (Date.now() - new Date(dateStr).getTime()) / (1000 * 3600 * 24);
    if (daysOld <= 3) return 'text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)] bg-green-500/10';
    if (daysOld >= 14) return 'text-red-500 bg-red-500/10';
    return 'text-gray-500 bg-gray-500/10';
  };

  return (
    <div className="flex-1 flex flex-col w-full py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-5 md:p-8 mb-4 md:mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-400/20 to-alumni-400/20 dark:from-primary-500/10 dark:to-alumni-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Job Opportunities</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                Discover exciting career opportunities from our alumni network
              </p>
            </div>
            {(user?.role === 'alumni' || user?.role === 'admin') && (
              <Button variant="primary" onClick={() => setShowPostModal(true)} className="px-6 py-3 shrink-0">
                <Plus className="w-5 h-5 mr-2" /> Post Opportunity
              </Button>
            )}
          </div>

          <div className="relative z-10 hidden md:grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <div className="mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-4 sm:p-6 shadow-sm"
            >
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
            
            <div className="lg:col-span-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
              {sortedJobs.map((job) => (
                <motion.div
                  whileHover={{ x: 5 }}
                  key={job._id || job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`glass-card rounded-2xl p-5 cursor-pointer transition-all border ${
                    selectedJob && (selectedJob._id || selectedJob.id) === (job._id || job.id)
                      ? 'border-primary-500 shadow-md bg-white/80 dark:bg-gray-800/80' 
                      : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                      <JobLogo logo={job.companyLogo} company={job.company} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{job.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <Building className="w-3.5 h-3.5 mr-1 shrink-0" />
                        <span className="truncate">{job.company}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getJobTypeColor(job.jobType || 'full-time')}`}>
                          {(job.jobType || 'full-time').replace('-', ' ')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getDeadlineColor(job.createdAt)}`}>
                          {job.createdAt && (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 3600 * 24) <= 3 ? 'New' : 
                           job.createdAt && (Date.now() - new Date(job.createdAt).getTime()) / (1000 * 3600 * 24) >= 14 ? 'Expiring' : 'Ongoing'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {sortedJobs.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 sticky top-24 hidden lg:block">
              {selectedJob ? (
                <motion.div
                  key={selectedJob._id || selectedJob.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 shrink-0 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
                        <JobLogo logo={selectedJob.companyLogo} company={selectedJob.company} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{selectedJob.title}</h2>
                        <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{selectedJob.company}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {user && selectedJob.postedBy && (selectedJob.postedBy._id || selectedJob.postedBy) === user._id && (
                        <>
                          <button
                            onClick={() => setJobToEdit(selectedJob)}
                            className="p-3 rounded-xl transition-all text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Edit Job"
                          >
                            <Edit3 className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() => handleDeleteJob(selectedJob._id || selectedJob.id)}
                            className="p-3 rounded-xl transition-all text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete Job"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleSave(selectedJob._id || selectedJob.id)}
                        disabled={savedJobs.includes(selectedJob._id || selectedJob.id)}
                        className={`p-3 rounded-xl transition-all ${
                          savedJobs.includes(selectedJob._id || selectedJob.id) 
                            ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                            : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                        }`}
                      >
                        <Bookmark className={`w-6 h-6 ${savedJobs.includes(selectedJob._id || selectedJob.id) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Location</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-primary-500" />
                        {selectedJob.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Salary</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center">
                        <DollarSign className="w-4 h-4 mr-1 text-green-500" />
                        {selectedJob.salary?.min ? `$${selectedJob.salary.min.toLocaleString()}` : 'Not listed'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Experience</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">
                        {selectedJob.experience || 'Any'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">
                        {(selectedJob.jobType || 'full-time').replace('-', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Job Description</h3>
                    <p className={`text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap ${!isDescExpanded ? 'line-clamp-4' : ''}`}>{selectedJob.description}</p>
                    {selectedJob.description && selectedJob.description.length > 200 && (
                      <button 
                        onClick={() => setIsDescExpanded(!isDescExpanded)} 
                        className="mt-2 text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors"
                      >
                        {isDescExpanded ? 'Read Less' : 'Read More...'}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-4 flex-wrap">
                    {!matchResult && (
                      <button
                        onClick={handleCalculateMatch}
                        disabled={matchLoading}
                        className="flex-1 min-w-[200px] py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-2"
                      >
                        {matchLoading ? 'Analyzing...' : '✨ Calculate AI Match'}
                      </button>
                    )}
                    {selectedJob.isExternal ? (
                      <a
                        href={selectedJob.applicationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-center transition-all shadow-lg hover:shadow-primary-500/30"
                      >
                        Apply on External Site
                      </a>
                    ) : (
                      <>
                        {requestedReferrals.includes(selectedJob._id || selectedJob.id) ? (
                          <button disabled className="flex-1 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed font-bold rounded-xl flex items-center justify-center gap-2">
                            <UserPlus className="w-5 h-5" /> Requested
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReferralRequest(selectedJob._id || selectedJob.id, selectedJob.company, selectedJob.postedBy)}
                            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                          >
                            <UserPlus className="w-5 h-5" /> Request Referral
                          </button>
                        )}
                        
                        {appliedJobs.includes(selectedJob._id || selectedJob.id) ? (
                          <button disabled className="flex-1 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed font-bold rounded-xl flex items-center justify-center gap-2">
                            Applied
                          </button>
                        ) : (
                          <button
                            onClick={() => handleApply(selectedJob)}
                            className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary-500/30"
                          >
                            Apply Now
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              ) : (
                (user?.role === 'alumni' || user?.role === 'admin') ? (
                  <MyPostedJobs onSelectJob={setSelectedJob} />
                ) : (
                  <div className="glass-card rounded-3xl p-12 text-center h-[500px] flex flex-col items-center justify-center border-dashed border-2 border-gray-200 dark:border-gray-700">
                    <Briefcase className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a Job</h3>
                    <p className="text-gray-500 dark:text-gray-400">Click on a job from the list to view its details</p>
                  </div>
                )
              )}
            </div>

            {/* Mobile Modal for Job Details */}
            <AnimatePresence>
              {selectedJob && (
                <motion.div
                  initial={{ opacity: 0, y: "100%" }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed inset-0 z-[2000] bg-white dark:bg-gray-900 lg:hidden overflow-y-auto"
                >
                  <div className="p-4 pb-24">
                    <button onClick={() => setSelectedJob(null)} className="mb-4 flex items-center text-gray-500 font-semibold bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-xl w-fit">
                      <span className="mr-2">&larr;</span> Back to Jobs
                    </button>
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 shrink-0 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                          <JobLogo logo={selectedJob.companyLogo} company={selectedJob.company} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">{selectedJob.title}</h2>
                          <p className="text-md font-medium text-gray-600 dark:text-gray-400">{selectedJob.company}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user && selectedJob.postedBy && (selectedJob.postedBy._id || selectedJob.postedBy) === user._id && (
                          <>
                            <button onClick={() => setJobToEdit(selectedJob)} className="p-2 text-gray-500 hover:text-blue-500">
                              <Edit3 className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDeleteJob(selectedJob._id || selectedJob.id)} className="p-2 text-gray-500 hover:text-red-500">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleSave(selectedJob._id || selectedJob.id)} className="p-2 text-gray-500 hover:text-yellow-500">
                          <Bookmark className={`w-5 h-5 ${savedJobs.includes(selectedJob._id || selectedJob.id) ? 'fill-current text-yellow-500' : ''}`} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Location</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center"><MapPin className="w-3 h-3 mr-1 text-primary-500" />{selectedJob.location}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Salary</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center"><DollarSign className="w-3 h-3 mr-1 text-green-500" />{selectedJob.salary?.min ? `$${selectedJob.salary.min.toLocaleString()}` : 'Not listed'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Experience</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{selectedJob.experience || 'Any'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Type</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{(selectedJob.jobType || 'full-time').replace('-', ' ')}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Job Description</h3>
                      <p className={`text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap ${!isDescExpanded ? 'line-clamp-4' : ''}`}>{selectedJob.description}</p>
                      {selectedJob.description && selectedJob.description.length > 200 && (
                        <button 
                          onClick={() => setIsDescExpanded(!isDescExpanded)} 
                          className="mt-2 text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors"
                        >
                          {isDescExpanded ? 'Read Less' : 'Read More...'}
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {selectedJob.isExternal ? (
                        <a href={selectedJob.applicationLink} target="_blank" rel="noopener noreferrer" className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-center">Apply on External Site</a>
                      ) : (
                        <Button variant="primary" onClick={() => { handleApply(selectedJob); }} className="w-full py-3 text-center shadow-lg">Apply Now</Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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

      {showPostModal && (
        <PostJobModal 
          onClose={() => setShowPostModal(false)} 
          onSuccess={() => {
            setShowPostModal(false);
            fetchJobs();
          }} 
        />
      )}

      {jobToEdit && (
        <PostJobModal
          initialData={jobToEdit}
          onClose={() => setJobToEdit(null)}
          onSuccess={() => {
            setJobToEdit(null);
            fetchJobs();
          }}
        />
      )}

      {showApplyModal && (
        <ApplyJobModal
          job={showApplyModal}
          onClose={() => setShowApplyModal(null)}
          onSuccess={(jobId) => {
            setShowApplyModal(null);
            setAppliedJobs([...appliedJobs, jobId]);
          }}
        />
      )}
    </div>
  );
};

export default DefaultJobs;
