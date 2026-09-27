import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Building2, Search, ExternalLink, MapPin, 
  Users, TrendingUp, Briefcase, Filter, ShieldCheck, ChevronRight, X,
  Edit, Trash2, Rocket, Sparkles, Flame, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const STAGES = ["All", "Idea", "Seed", "Early Stage", "Growth", "Established"];
const INDUSTRIES = [
  "All", 
  "Artificial Intelligence", 
  "CleanTech", 
  "FinTech", 
  "HealthTech", 
  "E-Commerce", 
  "SaaS", 
  "EdTech",
  "Hardware & IoT",
  "Other"
];

const STAGE_COLORS = {
  'Idea': 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
  'Seed': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'Early Stage': 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  'Growth': 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  'Established': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
};

const BusinessDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [onlyHiring, setOnlyHiring] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { user } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', industry: 'SaaS', location: '', stage: 'Seed', description: '', website: '', logo: '', tags: '', hiring: false, employees: '1-10'
  });

  const resetForm = () => {
    setFormData({
      name: '', industry: 'SaaS', location: '', stage: 'Seed', description: '', website: '', logo: '', tags: '', hiring: false, employees: '1-10'
    });
    setEditingId(null);
  };

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/business');
      setBusinesses(res.data.businesses || []);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      toast.error('Failed to load startups');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        tags: typeof formData.tags === 'string' ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : formData.tags
      };

      if (editingId) {
        await api.put(`/business/${editingId}`, dataToSubmit);
        toast.success('Startup updated successfully!');
      } else {
        await api.post('/business', dataToSubmit);
        toast.success('Startup submitted successfully!');
      }
      
      setShowAddModal(false);
      resetForm();
      fetchBusinesses();
    } catch (err) {
      console.error('Error saving business:', err);
      toast.error(err.response?.data?.message || 'Failed to save startup');
    }
  };

  const handleEdit = (biz) => {
    setFormData({
      name: biz.name || '',
      industry: biz.industry || 'SaaS',
      location: biz.location || '',
      stage: biz.stage || 'Seed',
      description: biz.description || '',
      website: biz.website || '',
      logo: biz.logo || '',
      tags: biz.tags ? biz.tags.join(', ') : '',
      hiring: biz.hiring || false,
      employees: biz.employees || '1-10'
    });
    setEditingId(biz._id);
    setShowAddModal(true);
  };

  const handleDelete = async (bizId) => {
    if (!window.confirm('Are you sure you want to delete this startup?')) return;
    try {
      await api.delete(`/business/${bizId}`);
      toast.success('Startup deleted successfully!');
      fetchBusinesses();
    } catch (err) {
      console.error('Error deleting business:', err);
      toast.error('Failed to delete startup');
    }
  };

  const stats = useMemo(() => {
    const total = businesses.length;
    const hiringCount = businesses.filter(b => b.hiring).length;
    const sectors = new Set(businesses.map(b => b.industry).filter(Boolean)).size;
    const funded = businesses.filter(b => ['Seed', 'Early Stage', 'Growth', 'Established'].includes(b.stage)).length;
    return { total, hiringCount, sectors, funded };
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(biz => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        biz.name?.toLowerCase().includes(q) || 
        biz.description?.toLowerCase().includes(q) ||
        biz.location?.toLowerCase().includes(q) ||
        biz.founder?.name?.toLowerCase().includes(q) ||
        biz.tags?.some(t => t.toLowerCase().includes(q));

      const matchesIndustry = activeFilter === "All" || biz.industry === activeFilter;
      const matchesStage = stageFilter === "All" || biz.stage === stageFilter;
      const matchesHiring = !onlyHiring || biz.hiring === true;

      return matchesSearch && matchesIndustry && matchesStage && matchesHiring;
    });
  }, [businesses, searchTerm, activeFilter, stageFilter, onlyHiring]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 sm:px-6 lg:px-8 py-6 w-full">
      
      {/* ⭐ Alumnex Blue-Violet Hero Header ⭐ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white"
      >
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-violet-600/15 rounded-full blur-[100px] translate-y-1/3 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[90px] -translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 p-8 sm:p-12 lg:p-14">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-5 backdrop-blur-md">
                <Rocket className="w-3.5 h-3.5 text-indigo-400" />
                <span>Alumni Entrepreneurship & Ventures</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
                Startup & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-violet-400">Business Network</span>
              </h1>
              
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
                Discover disruptive companies, products, and services founded by our alumni network. Connect directly with founders, partner on projects, or land high-growth roles.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3.5 shrink-0">
              <button 
                onClick={() => { resetForm(); setShowAddModal(true); }} 
                className="px-7 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 text-base cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Sparkles className="w-5 h-5 text-indigo-200" />
                <span>List Your Startup</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>

              <div className="flex items-center justify-center gap-2 text-indigo-200 text-xs font-semibold px-2 py-1 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Alumni Ecosystem</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/10">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Startups</p>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.total}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Hiring Now</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.hiringCount}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Funded & Scaling</p>
              <p className="text-2xl sm:text-3xl font-black text-indigo-300">{stats.funded}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Industry Sectors</p>
              <p className="text-2xl sm:text-3xl font-black text-violet-300">{stats.sectors || INDUSTRIES.length - 1}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ⭐ Filter & Search Controls Bar ⭐ */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by startup, tag, founder, or city..."
              className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900 dark:text-white placeholder-slate-400 text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Stage Dropdown */}
            <div className="relative">
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-sm font-semibold rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-sm"
              >
                {STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage === 'All' ? 'All Stages' : stage}</option>
                ))}
              </select>
            </div>

            {/* Hiring Toggle Filter */}
            <button
              onClick={() => setOnlyHiring(!onlyHiring)}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm cursor-pointer border ${
                onlyHiring 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-emerald-500/10'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-500/40'
              }`}
            >
              <Flame className={`w-4 h-4 ${onlyHiring ? 'text-emerald-500 fill-emerald-500 animate-pulse' : 'text-slate-400'}`} />
              <span>Hiring Only</span>
            </button>
          </div>
        </div>

        {/* Industry Pill Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide pt-1">
          <span className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 pr-2 shrink-0">
            <Filter className="w-3.5 h-3.5 mr-1" /> Sector:
          </span>
          {INDUSTRIES.map((ind) => {
            const isActive = activeFilter === ind;
            return (
              <button
                key={ind}
                onClick={() => setActiveFilter(ind)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {ind}
              </button>
            );
          })}
        </div>
      </div>

      {/* ⭐ Startup Grid & Cards ⭐ */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-64 rounded-3xl bg-slate-800/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredBusinesses.length === 0 ? (
        /* Empty State */
        <div className="glass-card bg-white dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-white/10 max-w-xl mx-auto space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
            <Building2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Startups Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            We couldn't find any startups matching your active filters. Try broadening your search or clear filters.
          </p>
          <button
            onClick={() => { setSearchTerm(''); setActiveFilter('All'); setStageFilter('All'); setOnlyHiring(false); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md text-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBusinesses.map((biz, index) => {
            const isLogoUrl = biz.logo && (biz.logo.startsWith('http://') || biz.logo.startsWith('https://'));
            const stageClass = STAGE_COLORS[biz.stage] || STAGE_COLORS['Seed'];
            const isOwner = user?._id === biz.founder?._id || user?.role === 'admin';

            return (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
                key={biz._id || biz.id}
                className="group glass-card bg-white dark:bg-slate-900/70 rounded-3xl p-7 border border-slate-200/90 dark:border-white/10 shadow-sm hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Subtle Card Glow */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />

                <div>
                  {/* Card Header: Logo, Name, Founder, Actions */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Logo / Monogram */}
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-indigo-500/25 shrink-0 border border-white/10">
                        {isLogoUrl ? (
                          <img src={biz.logo} alt={biz.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{biz.logo || biz.name?.charAt(0) || 'V'}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                            {biz.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>Founder:</span>
                          {biz.founder?._id ? (
                            <Link 
                              to={`/users/${biz.founder._id}`} 
                              className="font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400 hover:underline transition-colors"
                            >
                              {biz.founder.name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{biz.founder?.name || 'Alumnus'}</span>
                          )}
                          <span className="text-emerald-500" title="Verified Alumni Founder">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badges & Quick Action Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      {biz.hiring && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Hiring</span>
                        </span>
                      )}

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${stageClass}`}>
                        {biz.stage || 'Seed'}
                      </span>

                      {isOwner && (
                        <div className="flex items-center gap-1 ml-1">
                          <button 
                            onClick={() => handleEdit(biz)} 
                            title="Edit Startup"
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(biz._id || biz.id)} 
                            title="Delete Startup"
                            className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-5 line-clamp-3">
                    {biz.description}
                  </p>

                  {/* Tags */}
                  {biz.tags && biz.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {biz.tags.map((tag, i) => (
                        <span 
                          key={i} 
                          className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-200/60 dark:border-indigo-500/20"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Bottom: Metadata Strip & Links */}
                <div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 mb-4 text-xs">
                    <div>
                      <div className="flex items-center gap-1 text-slate-400 mb-0.5 font-bold uppercase tracking-wider">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        <span>HQ</span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{biz.location || 'Remote'}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-slate-400 mb-0.5 font-bold uppercase tracking-wider">
                        <TrendingUp className="w-3 h-3 text-indigo-400" />
                        <span>Stage</span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{biz.stage || 'Seed'}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-slate-400 mb-0.5 font-bold uppercase tracking-wider">
                        <Users className="w-3 h-3 text-indigo-400" />
                        <span>Team</span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{biz.employees || '1-10'}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-slate-400 mb-0.5 font-bold uppercase tracking-wider">
                        <Briefcase className="w-3 h-3 text-indigo-400" />
                        <span>Sector</span>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{biz.industry || 'Technology'}</p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    {biz.website ? (
                      <a
                        href={biz.website.startsWith('http') ? biz.website : `https://${biz.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                      >
                        <span>Visit Website</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Website not listed</span>
                    )}

                    {biz.founder?._id && (
                      <Link
                        to={`/chat`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700/60 transition-colors"
                      >
                        <span>Message Founder</span>
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ⭐ Add/Edit Startup Modal ⭐ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-white/10"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {editingId ? 'Edit Startup Listing' : 'List Your Startup'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Share your company with the Alumnex network</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); resetForm(); }} 
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Company Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="e.g. Nexus AI" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Industry Sector *</label>
                  <select 
                    name="industry" 
                    value={formData.industry} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {INDUSTRIES.filter(i => i !== 'All').map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Headquarters / Location *</label>
                  <input 
                    type="text" 
                    name="location" 
                    required 
                    value={formData.location} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="e.g. Bengaluru, India or Remote" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Venture Stage</label>
                  <select 
                    name="stage" 
                    value={formData.stage} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {STAGES.filter(s => s !== 'All').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Website URL</label>
                  <input 
                    type="url" 
                    name="website" 
                    value={formData.website} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="https://yourstartup.com" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Team Size</label>
                  <select 
                    name="employees" 
                    value={formData.employees} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="1-10">1-10 Employees</option>
                    <option value="11-50">11-50 Employees</option>
                    <option value="51-200">51-200 Employees</option>
                    <option value="200+">200+ Employees</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Logo (URL or 1-2 Letter Acronym)</label>
                  <input 
                    type="text" 
                    name="logo" 
                    value={formData.logo} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="e.g. https://... or NX" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Description *</label>
                  <textarea 
                    name="description" 
                    required 
                    rows={3} 
                    maxLength={500} 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="What problem does your startup solve? Describe your core mission and products."
                  />
                  <div className="text-right text-xs text-slate-400 mt-1">
                    {formData.description.length} / 500
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">Tags (Comma-separated)</label>
                  <input 
                    type="text" 
                    name="tags" 
                    value={formData.tags} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
                    placeholder="AI, B2B, SaaS, MachineLearning" 
                  />
                </div>

                <div className="md:col-span-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <label htmlFor="hiring" className="text-sm font-bold text-slate-800 dark:text-slate-200 block cursor-pointer">
                      Actively Hiring
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Display a live hiring badge to attract students and alumni</p>
                  </div>
                  <input 
                    type="checkbox" 
                    id="hiring" 
                    name="hiring" 
                    checked={formData.hiring} 
                    onChange={handleInputChange} 
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                  />
                </div>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setShowAddModal(false); resetForm(); }} 
                  className="flex-1 py-3 px-4 font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 px-4 font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-sm cursor-pointer"
                >
                  {editingId ? 'Update Listing' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default BusinessDirectory;
