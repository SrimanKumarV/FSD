import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import { toast } from 'react-hot-toast';
import PostJobModal from '../../components/jobs/PostJobModal';

const StitchJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internalJobs, setInternalJobs] = useState([]);
  const [externalJobs, setExternalJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('referrals');
  
  // Job Modal State
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);

  const fetchJobs = () => {
    setLoading(true);
    Promise.allSettled([api.get('/jobs'), api.get('/jobs/external')])
      .then(([ir, er]) => {
        if (ir.status === 'fulfilled') setInternalJobs(ir.value.data.jobs || ir.value.data || []);
        if (er.status === 'fulfilled') setExternalJobs(er.value.data.jobs || er.value.data || []);
      })
      .finally(() => setLoading(false));
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    try {
      await api.delete(`/jobs/${jobId}`);
      toast.success('Job deleted successfully');
      setInternalJobs(internalJobs.filter(j => (j._id || j.id) !== jobId));
      if (selectedJob && (selectedJob._id || selectedJob.id) === jobId) {
        setSelectedJob(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete job');
    }
  };

  useEffect(() => {
    Promise.allSettled([api.get('/jobs'), api.get('/jobs/external')])
      .then(([ir, er]) => {
        if (ir.status === 'fulfilled') setInternalJobs(ir.value.data.jobs || ir.value.data || []);
        if (er.status === 'fulfilled') setExternalJobs(er.value.data.jobs || er.value.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filter = (jobs) => jobs.filter(j =>
    !search ||
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCalculateMatch = async () => {
    if (!selectedJob || !user) return;
    setMatchLoading(true);
    try {
      const payload = {
        jobDescription: selectedJob.description || selectedJob.title,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-blue-500 border-r-violet-500 animate-spin" />
      </div>
    );
  }

  const JobCard = ({ job, type }) => (
    <div onClick={() => { setSelectedJob(job); setMatchResult(null); setIsDescExpanded(false); }} className="glass-card rounded-2xl p-5 flex gap-4 group cursor-pointer hover:border-blue-500/50 transition-colors">
      {/* Company Logo */}
      <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl font-bold text-white" style={{ background:'linear-gradient(135deg,rgba(37,99,235,0.30),rgba(124,58,237,0.30))', border:'1px solid rgba(255,255,255,0.10)' }}>
        {job.company?.charAt(0) || 'C'}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-white text-sm">{job.title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: type === 'referral' ? 'rgba(244,114,182,0.15)' : 'rgba(34,211,238,0.12)', color: type === 'referral' ? '#f472b6' : '#22d3ee' }}>
            {type === 'referral' ? 'Internal' : 'External'}
          </span>
        </div>
        <p className="text-xs mb-2" style={{ color:'rgba(241,245,249,0.55)' }}>
          {job.company}{job.location ? ` · ${job.location}` : ''}
        </p>
        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(job.skills || job.requirements || []).slice(0, 4).map((s, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-md font-mono" style={{ background:'rgba(255,255,255,0.06)', color:'#93c5fd', border:'1px solid rgba(255,255,255,0.08)' }}>{s}</span>
          ))}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-sm font-semibold" style={{ color:'rgba(241,245,249,0.80)' }}>{job.salary || 'Competitive'}</span>
          <div className="flex gap-2">
            <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" aria-label="Save" onClick={(e) => e.stopPropagation()}>
              <span className="material-symbols-outlined text-base" style={{ color:'rgba(241,245,249,0.45)' }}>bookmark_border</span>
            </button>
            <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105" style={{ background: type === 'referral' ? 'linear-gradient(135deg,#be185d,#9333ea)' : 'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow:'0 3px 12px rgba(37,99,235,0.30)' }}>
              {type === 'referral' ? 'Ask Referral' : 'Apply Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const shown = activeTab === 'referrals' ? filter(internalJobs) : filter(externalJobs);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 relative">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Career Opportunities</h1>
          <p className="text-sm mt-1" style={{ color:'rgba(241,245,249,0.55)' }}>Discover referrals and global positions curated for Alumnex.</p>
        </div>
        {/* Search */}
        <div className="glass-card rounded-full px-4 py-2.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ color:'rgba(241,245,249,0.45)' }}>search</span>
          <input
            className="bg-transparent border-none outline-none text-sm w-44 text-white placeholder:text-slate-500"
            placeholder="Search roles, companies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Alumni Referrals', value: internalJobs.length, icon: '⭐', color: 'rgba(244,114,182,0.15)', textColor: '#f472b6' },
          { label: 'External Listings', value: externalJobs.length, icon: '🌐', color: 'rgba(34,211,238,0.12)', textColor: '#22d3ee' },
          { label: 'Total Jobs', value: internalJobs.length + externalJobs.length, icon: '💼', color: 'rgba(59,130,246,0.15)', textColor: '#60a5fa' },
        ].map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-5 text-center" style={{ border:`1px solid ${s.textColor}22` }}>
            <p className="text-3xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold" style={{ color: s.textColor }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color:'rgba(241,245,249,0.50)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Main */}
        <div className="xl:col-span-8 space-y-5">
          {/* Tab selector */}
          <div className="flex gap-2">
            {[['referrals', '⭐ Alumni Referrals', internalJobs.length], ['external', '🌐 External Jobs', externalJobs.length]].map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={activeTab === key
                  ? { background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', boxShadow:'0 4px 15px rgba(37,99,235,0.35)' }
                  : { background:'rgba(255,255,255,0.06)', color:'rgba(241,245,249,0.65)', border:'1px solid rgba(255,255,255,0.09)' }
                }
              >
                {label}
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background:'rgba(255,255,255,0.15)' }}>{count}</span>
              </button>
            ))}
          </div>

          {/* Job list */}
          <div className="space-y-4">
            {shown.length > 0 ? shown.map(job => (
              <JobCard key={job._id || job.id} job={job} type={activeTab === 'referrals' ? 'referral' : 'external'} />
            )) : (
              <div className="glass-card rounded-2xl p-12 text-center">
                <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color:'rgba(241,245,249,0.30)' }}>work_off</span>
                <p className="text-white font-medium">No jobs found</p>
                <p className="text-sm mt-1" style={{ color:'rgba(241,245,249,0.45)' }}>Try a different search or check back later.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="xl:col-span-4 hidden xl:flex flex-col gap-5">
          {/* Post a Job (alumni only) */}
          {user?.role === 'alumni' && (
            <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background:'linear-gradient(135deg,rgba(37,99,235,0.20),rgba(124,58,237,0.20))', border:'1px solid rgba(255,255,255,0.10)' }}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20" style={{ background:'radial-gradient(circle,#7c3aed,transparent)', transform:'translate(30%,-30%)' }} />
              <p className="text-lg mb-1 font-bold text-white">📢 Post a Referral</p>
              <p className="text-sm mb-4" style={{ color:'rgba(241,245,249,0.65)' }}>Help your network by sharing open roles at your company.</p>
              <button onClick={() => navigate('/career-board?action=post')} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background:'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow:'0 4px 15px rgba(37,99,235,0.35)' }}>
                Post a Job
              </button>
            </div>
          )}

          {/* Job filters */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-semibold text-white mb-4">Filter by Type</h3>
            <div className="space-y-2">
              {['Full-time', 'Part-time', 'Internship', 'Remote', 'Contract'].map(type => (
                <label key={type} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <input type="checkbox" className="w-4 h-4 rounded accent-blue-500" />
                  <span className="text-sm" style={{ color:'rgba(241,245,249,0.75)' }}>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Bookmarks */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-lg" style={{ color:'#60a5fa' }}>bookmarks</span>
              <h3 className="font-semibold text-white">Saved Jobs</h3>
            </div>
            <p className="text-sm text-center py-6" style={{ color:'rgba(241,245,249,0.40)' }}>Bookmark jobs to find them quickly later.</p>
          </div>
        </aside>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold text-white" style={{ background:'linear-gradient(135deg,rgba(37,99,235,0.30),rgba(124,58,237,0.30))', border:'1px solid rgba(255,255,255,0.10)' }}>
                  {selectedJob.company?.charAt(0) || 'C'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedJob.title}</h2>
                  <p className="text-sm text-blue-300">{selectedJob.company} {selectedJob.location ? `· ${selectedJob.location}` : ''}</p>
                  <p className="text-xs text-white/50 mt-1">{typeof selectedJob.salary === 'object' ? (selectedJob.salary?.min ? `$${selectedJob.salary.min.toLocaleString()}` : 'Competitive') : (selectedJob.salary || 'Competitive')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user && selectedJob.postedBy && (selectedJob.postedBy._id || selectedJob.postedBy) === (user._id || user.id) && (
                  <>
                    {((Date.now() - new Date(selectedJob.createdAt).getTime()) / (1000 * 60 * 60) <= 24) ? (
                      <button onClick={() => setJobToEdit(selectedJob)} className="text-white/50 hover:text-blue-400 bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors" title="Edit Job (Only available for 24 hours)">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    ) : (
                      <button disabled className="text-white/20 bg-white/5 p-2 rounded-lg cursor-not-allowed" title="Edit time limit (24h) expired">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    )}
                    <button onClick={() => handleDeleteJob(selectedJob._id || selectedJob.id)} className="text-white/50 hover:text-red-400 bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors" title="Delete Job">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </>
                )}
                <button onClick={() => { setSelectedJob(null); setMatchResult(null); }} className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
            
            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {matchResult && (
                <div className="p-5 rounded-xl border border-white/10" style={{ background:'linear-gradient(135deg,rgba(37,99,235,0.10),rgba(124,58,237,0.10))' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">✨</span>
                    <h3 className="font-bold text-white">AI Match: {matchResult.score}%</h3>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed mb-3">{matchResult.analysis}</p>
                  
                  {matchResult.missingSkills?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Missing Skills to Learn</p>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.missingSkills.map((s, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Job Description</h3>
                <div className={`text-sm text-white/80 leading-relaxed whitespace-pre-wrap ${!isDescExpanded ? 'line-clamp-4' : ''}`}>
                  {selectedJob.description || 'No detailed description provided.'}
                </div>
                {selectedJob.description && selectedJob.description.length > 200 && (
                  <button 
                    onClick={() => setIsDescExpanded(!isDescExpanded)} 
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    {isDescExpanded ? 'Read Less' : 'Read More...'}
                  </button>
                )}
              </div>
              
              {(selectedJob.skills?.length > 0 || selectedJob.requirements?.length > 0) && (
                <div>
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Requirements & Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {(selectedJob.skills || []).concat(selectedJob.requirements || []).map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-md font-mono border border-blue-500/30 bg-blue-500/10 text-blue-300">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Fixed Footer */}
            <div className="p-5 border-t border-white/10 bg-[#0f172a] flex justify-end gap-3 shrink-0">
              <button 
                onClick={handleCalculateMatch}
                disabled={matchLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center gap-2 border border-white/10 hover:bg-white/10 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">{matchLoading ? 'sync' : 'auto_awesome'}</span>
                {matchLoading ? 'Analyzing...' : 'AI Match'}
              </button>
              
              <a 
                href={selectedJob.applicationLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center gap-2 shadow-lg"
                style={{ background:'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow:'0 4px 15px rgba(37,99,235,0.35)' }}
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Apply on external site
              </a>
            </div>
          </div>
        </div>
      )}
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
    </div>
  );
};

export default StitchJobs;
