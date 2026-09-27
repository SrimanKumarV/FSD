import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

const iconMap = {
  Users: '👥', Briefcase: '💼', Calendar: '📅', MessageSquare: '💬', Info: 'ℹ️'
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="glass-card rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-pointer">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-sm mt-0.5" style={{ color: 'rgba(241,245,249,0.60)' }}>{label}</p>
    </div>
  </div>
);

const StitchDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({ stats: [], recentActivities: [], upcomingEvents: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/dashboard')
      .then(r => setDashboardData(r.data))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const { stats, recentActivities, upcomingEvents } = dashboardData;

  const quickActions = [
    { name: 'Find Mentor', icon: '🎓', href: '/mentorship', desc: 'Connect with alumni', gradient: 'from-blue-600 to-violet-600' },
    { name: 'Browse Jobs', icon: '💼', href: '/jobs', desc: 'Explore opportunities', gradient: 'from-emerald-500 to-teal-600' },
    { name: 'Join Event', icon: '📅', href: '/events', desc: 'Workshops & seminars', gradient: 'from-orange-500 to-rose-500' },
    { name: 'Forum', icon: '💬', href: '/forum', desc: 'Start a discussion', gradient: 'from-violet-600 to-purple-700' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-blue-500 border-r-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">

      {/* Hero greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Welcome back, <span style={{ background: 'linear-gradient(135deg,#60a5fa,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0] || 'there'}</span> 👋
          </h1>
          <p className="mt-1 text-base" style={{ color: 'rgba(241,245,249,0.60)' }}>Here's what's happening in your alumni network today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card rounded-full px-4 py-2.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" style={{ color: 'rgba(241,245,249,0.45)' }}>search</span>
            <input className="bg-transparent border-none outline-none text-sm w-40 text-white placeholder:text-slate-500" placeholder="Search network..." />
          </div>
          <button className="glass-card p-2.5 rounded-full relative hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
        </div>
      </div>

      {/* Stats grid */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <StatCard
              key={i}
              label={stat.label}
              value={stat.value}
              icon={stat.icon || '📊'}
              color={['bg-blue-500/20 text-blue-400','bg-violet-500/20 text-violet-400','bg-emerald-500/20 text-emerald-400','bg-rose-500/20 text-rose-400'][i % 4]}
            />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="glass-card rounded-2xl p-5 flex flex-col gap-3 group hover:no-underline"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-lg shadow-lg group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{action.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(241,245,249,0.55)' }}>{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two-column: Activities + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Recent Activity</h2>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background:'rgba(59,130,246,0.15)', color:'#60a5fa' }}>Live</span>
          </div>
          <div className="space-y-4">
            {recentActivities && recentActivities.length > 0 ? recentActivities.slice(0, 5).map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5" style={{ background:'rgba(255,255,255,0.08)' }}>
                  {activity.icon || '📌'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{activity.title || activity.description}</p>
                  <p className="text-xs mt-0.5" style={{ color:'rgba(241,245,249,0.45)' }}>{activity.time || activity.date}</p>
                </div>
                {activity.status && (
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background:'rgba(52,211,153,0.15)', color:'#34d399' }}>
                    {activity.status}
                  </span>
                )}
              </div>
            )) : (
              <p className="text-sm text-center py-8" style={{ color:'rgba(241,245,249,0.40)' }}>No recent activity yet.</p>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white">Upcoming Events</h2>
            <Link to="/events" className="text-xs" style={{ color:'#60a5fa' }}>View all →</Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents && upcomingEvents.length > 0 ? upcomingEvents.slice(0, 4).map((evt, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0" style={{ background:'linear-gradient(135deg,rgba(37,99,235,0.25),rgba(124,58,237,0.25))' }}>
                  <span className="text-xs font-bold text-blue-400 uppercase leading-none">
                    {new Date(evt.date).toLocaleString('en', { month: 'short' })}
                  </span>
                  <span className="text-lg font-bold text-white leading-none">
                    {new Date(evt.date).getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{evt.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color:'rgba(241,245,249,0.50)' }}>{evt.location || evt.platform || 'Online'}</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-center py-8" style={{ color:'rgba(241,245,249,0.40)' }}>No upcoming events.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StitchDashboard;
