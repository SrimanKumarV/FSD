import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Building, Clock, ExternalLink } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CareerBoard = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs');
      setJobs(res.data.jobs || []);
    } catch (error) {
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'jobs') return job.jobType === 'full-time' || job.jobType === 'part-time' || job.jobType === 'contract';
    if (activeTab === 'internships') return job.jobType === 'internship';
    if (activeTab === 'referrals') return job.category === 'referral';
    return true; // fallback
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Career Opportunities</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Find internships, jobs, referrals, and walk-in drives posted by alumni.</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-primary-700 transition-colors">
          Post Opportunity
        </button>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-800 mb-6">
        {['jobs', 'internships', 'referrals'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 font-medium capitalize transition-colors ${
              activeTab === tab 
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading opportunities...</div>
      ) : (
        <div className="grid gap-6">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">No {activeTab} available at the moment.</div>
          ) : (
            filteredJobs.map(job => (
              <div key={job._id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                      {job.companyLogo ? (
                        <img src={job.companyLogo} alt={job.company} className="w-10 h-10 object-contain rounded" />
                      ) : (
                        <Building className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="flex items-center"><Building className="w-4 h-4 mr-1 text-gray-400"/> {job.company}</span>
                        <span className="flex items-center"><MapPin className="w-4 h-4 mr-1 text-gray-400"/> {job.location} {job.isRemote && '(Remote)'}</span>
                        <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1 text-gray-400"/> <span className="capitalize">{job.jobType}</span></span>
                        <span className="flex items-center"><Clock className="w-4 h-4 mr-1 text-gray-400"/> {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      {job.skills && job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {job.skills.map((skill, idx) => (
                            <span key={idx} className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs px-2 py-1 rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {job.applicationLink ? (
                      <a href={job.applicationLink} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto text-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                        Apply External <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <button className="w-full sm:w-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Apply Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CareerBoard;
