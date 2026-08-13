import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Search, ExternalLink, MapPin, 
  Users, TrendingUp, Briefcase, Filter, ShieldCheck, ChevronRight, X
} from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const BusinessDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', industry: '', location: '', stage: 'Idea', description: '', website: '', logo: '', tags: '', hiring: false
  });

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
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };
      await api.post('/business', dataToSubmit);
      toast.success('Startup submitted successfully!');
      setShowAddModal(false);
      fetchBusinesses(); // Refresh list
    } catch (err) {
      console.error('Error creating business:', err);
      toast.error(err.response?.data?.message || 'Failed to submit startup');
    }
  };

  const industries = ["All", "Artificial Intelligence", "CleanTech", "FinTech", "HealthTech", "E-Commerce", "SaaS", "Other"];

  const filteredBusinesses = businesses.filter(biz => {
    const matchesSearch = biz.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          biz.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "All" || biz.industry === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-white/10"
        style={{ background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)' }}
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        
        <div className="relative z-10 p-8 md:p-12 lg:p-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm font-bold tracking-widest text-emerald-400 uppercase">Alumni Ecosystem</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
              Startup & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Business Network</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Discover innovative companies founded and led by our alumni. Connect for partnerships, explore investment opportunities, or find your next career move.
            </p>
          </div>
          <div className="hidden md:flex flex-col gap-4">
            <button onClick={() => setShowAddModal(true)} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2">
              List Your Startup <ChevronRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium px-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified Alumni Ventures
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search startups, industries..."
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all dark:text-white placeholder-slate-400 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          <Filter className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" />
          {industries.map((ind) => (
            <button
              key={ind}
              onClick={() => setActiveFilter(ind)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeFilter === ind 
                ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-white shadow-md' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500'
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Startup Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {filteredBusinesses.map((biz, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={biz.id}
            className="group bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-500/30">
                  {biz.logo}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors flex items-center gap-2">
                    {biz.name}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Founder: {biz.founder?.name || 'Unknown'}</p>
                </div>
              </div>
              <button className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all">
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-300 mb-6 line-clamp-2">
              {biz.description}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {biz.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700">
                  {tag}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">HQ</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{biz.location}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Stage</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{biz.stage}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Size</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{biz.employees}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Industry</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{biz.industry}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Startup Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Add Your Startup</h2>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Startup Name *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl" placeholder="e.g. Acme Corp" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Industry *</label>
                  <input type="text" name="industry" required value={formData.industry} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl" placeholder="e.g. Technology" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location *</label>
                  <input type="text" name="location" required value={formData.location} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl" placeholder="e.g. San Francisco, CA" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Stage</label>
                  <select name="stage" value={formData.stage} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl">
                    <option value="Idea">Idea</option>
                    <option value="Seed">Seed</option>
                    <option value="Early Stage">Early Stage</option>
                    <option value="Growth">Growth</option>
                    <option value="Established">Established</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                  <textarea name="description" required rows="4" maxLength={500} value={formData.description} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl" placeholder="What does your startup do?"></textarea>
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.description.length} / 500
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Website URL</label>
                  <input type="url" name="website" value={formData.website} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Logo URL (Optional)</label>
                  <input type="url" name="logo" value={formData.logo} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl" placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tags (comma separated)</label>
                  <input type="text" name="tags" value={formData.tags} onChange={handleInputChange} className="glass-input w-full px-4 py-3 rounded-xl" placeholder="AI, SaaS, B2B" />
                </div>
                <div className="md:col-span-2 flex items-center">
                  <input type="checkbox" id="hiring" name="hiring" checked={formData.hiring} onChange={handleInputChange} className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <label htmlFor="hiring" className="ml-3 font-medium text-gray-700 dark:text-gray-300">We are actively hiring!</label>
                </div>
              </div>
              
              <div className="border-t border-gray-100 dark:border-gray-700 pt-6 flex gap-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 px-4 font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 px-4 font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg transition-all">
                  Submit Listing
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
