import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

const StitchMentorship = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/mentorship/mentors')
      .then(r => setMentors(r.data || []))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = mentors.filter(m =>
    !search ||
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.currentRole?.toLowerCase().includes(search.toLowerCase()) ||
    (m.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-blue-500 border-r-violet-500 animate-spin" />
      </div>
    );
  }

  const gradients = [
    'from-blue-600 to-violet-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-orange-500 to-amber-600',
    'from-indigo-500 to-blue-600',
    'from-violet-600 to-purple-700',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Discover Mentors</h1>
        <p className="text-sm mt-1" style={{ color:'rgba(241,245,249,0.55)' }}>Connect with verified alumni leaders to guide your career journey.</p>
      </div>

      {/* Search & Filters */}
      <div className="glass-card rounded-2xl p-5 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color:'rgba(241,245,249,0.40)' }}>search</span>
          <input
            className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white"
            placeholder="Search by name, role, or skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <select className="glass-input px-4 py-3 rounded-xl text-sm text-white min-w-[160px]">
            <option value="">Industry (All)</option>
            <option>Technology</option>
            <option>Finance</option>
            <option>Healthcare</option>
          </select>
          <select className="glass-input px-4 py-3 rounded-xl text-sm text-white min-w-[160px]">
            <option value="">Skills (All)</option>
            <option>React / MERN</option>
            <option>Python / Data</option>
            <option>AI / ML</option>
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6">
        <span className="text-sm" style={{ color:'rgba(241,245,249,0.55)' }}>
          Showing <span className="text-white font-semibold">{filtered.length}</span> mentors
        </span>
        <div className="flex gap-2">
          {['All', 'Available', 'Top Rated'].map(tab => (
            <button key={tab} className="text-xs px-3 py-1.5 rounded-full transition-all" style={{ background: tab === 'All' ? 'rgba(59,130,246,0.20)' : 'rgba(255,255,255,0.06)', color: tab === 'All' ? '#60a5fa' : 'rgba(241,245,249,0.55)', border: '1px solid ' + (tab === 'All' ? 'rgba(59,130,246,0.30)' : 'rgba(255,255,255,0.09)') }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Mentor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.length > 0 ? filtered.map((mentor, idx) => (
          <article key={mentor._id} className="glass-card rounded-2xl p-6 flex flex-col group">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradients[idx % gradients.length]} flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform`}>
                {mentor.name?.charAt(0)?.toUpperCase() || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-white truncate">{mentor.name}</h3>
                  <div className="flex items-center gap-1 flex-shrink-0" style={{ color:'#fbbf24' }}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings:"'FILL' 1" }}>star</span>
                    <span className="text-xs font-semibold">5.0</span>
                  </div>
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color:'rgba(241,245,249,0.55)' }}>{mentor.currentRole || mentor.role || 'Alumni Mentor'}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background:'rgba(244,114,182,0.12)', border:'1px solid rgba(244,114,182,0.20)' }}>
                  <span className="material-symbols-outlined text-xs" style={{ color:'#f472b6' }}>verified</span>
                  <span className="text-xs font-medium" style={{ color:'#f472b6' }}>Verified Alumni</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm mb-4 flex-1 line-clamp-2" style={{ color:'rgba(241,245,249,0.65)' }}>
              {mentor.bio || 'Experienced professional ready to share insights and guide your career.'}
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {(mentor.skills || mentor.expertise || []).slice(0, 4).map((skill, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-lg font-mono" style={{ background:'rgba(255,255,255,0.07)', color:'rgba(241,245,249,0.70)', border:'1px solid rgba(255,255,255,0.10)' }}>
                  {skill}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between pt-4" style={{ borderTop:'1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <p className="text-xs" style={{ color:'rgba(241,245,249,0.40)' }}>Available for</p>
                <p className="text-sm font-medium text-white">1:1 Sessions</p>
              </div>
              <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg" style={{ background:`linear-gradient(135deg,${gradients[idx % gradients.length].replace('from-','').replace(' to-',',').split(',').map(c=>`#${c.replace('blue-600','2563eb').replace('violet-600','7c3aed').replace('emerald-500','10b981').replace('teal-600','0d9488').replace('rose-500','f43f5e').replace('pink-600','db2777').replace('orange-500','f97316').replace('amber-600','d97706').replace('indigo-500','6366f1').replace('purple-700','7e22ce')}`).join(',')}`, boxShadow:`0 4px 15px rgba(37,99,235,0.30)` }}>
                Book 1:1
              </button>
            </div>
          </article>
        )) : (
          <div className="col-span-3 glass-card rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color:'rgba(241,245,249,0.30)' }}>person_search</span>
            <p className="text-white font-medium">No mentors found</p>
            <p className="text-sm mt-1" style={{ color:'rgba(241,245,249,0.45)' }}>Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StitchMentorship;
