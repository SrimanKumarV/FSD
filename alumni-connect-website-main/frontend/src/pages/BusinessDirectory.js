import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Search, ExternalLink, MapPin, 
  Users, TrendingUp, Briefcase, Filter, ShieldCheck, ChevronRight
} from 'lucide-react';

// Mock Data for Startups/Businesses
const mockBusinesses = [
  {
    id: 1,
    name: "NexusAI",
    founder: "Sarah Chen (Class of '19)",
    logo: "N",
    industry: "Artificial Intelligence",
    location: "San Francisco, CA",
    employees: "10-50",
    stage: "Series A",
    description: "Building the next generation of predictive analytics for enterprise supply chains.",
    hiring: true,
    tags: ["Machine Learning", "Enterprise", "B2B"]
  },
  {
    id: 2,
    name: "EcoTrack",
    founder: "Marcus Johnson (Class of '21)",
    logo: "E",
    industry: "CleanTech",
    location: "Berlin, Germany",
    employees: "1-10",
    stage: "Seed",
    description: "Smart IoT sensors for urban carbon footprint monitoring and optimization.",
    hiring: false,
    tags: ["IoT", "Sustainability", "Hardware"]
  },
  {
    id: 3,
    name: "FinFlow",
    founder: "Priya Patel (Class of '18)",
    logo: "F",
    industry: "FinTech",
    location: "London, UK",
    employees: "50-200",
    stage: "Series B",
    description: "Democratizing cross-border payments with ultra-low latency blockchain infrastructure.",
    hiring: true,
    tags: ["Blockchain", "Payments", "Web3"]
  },
  {
    id: 4,
    name: "MedSync",
    founder: "Dr. David Kim (Class of '15)",
    logo: "M",
    industry: "HealthTech",
    location: "Boston, MA",
    employees: "10-50",
    stage: "Series A",
    description: "Unified patient record platform standardizing data across state hospital systems.",
    hiring: true,
    tags: ["Healthcare", "Data Privacy", "SaaS"]
  }
];

const BusinessDirectory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const industries = ["All", "Artificial Intelligence", "CleanTech", "FinTech", "HealthTech"];

  const filteredBusinesses = mockBusinesses.filter(biz => {
    const matchesSearch = biz.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          biz.description.toLowerCase().includes(searchTerm.toLowerCase());
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
            <button className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2">
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
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Founder: {biz.founder}</p>
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
                  <span className="text-xs font-bold uppercase tracking-wider">Jobs</span>
                </div>
                <p className="text-sm font-semibold text-emerald-500">{biz.hiring ? 'Hiring Now' : 'No Openings'}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredBusinesses.length === 0 && (
        <div className="py-20 text-center">
          <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-500 mb-2">No startups found</h3>
          <p className="text-slate-400">Try adjusting your search terms or filters.</p>
        </div>
      )}
    </div>
  );
};

export default BusinessDirectory;
