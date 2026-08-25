import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';

const StitchEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    api.get('/events')
      .then(r => setEvents((r.data || []).sort((a, b) => new Date(a.date) - new Date(b.date))))
      .catch(e => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const filters = ['All', 'Webinar', 'Workshop', 'Networking', 'Reunion'];
  const heroEvent = events[0] || null;
  const gridEvents = events.slice(1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-blue-500 border-r-violet-500 animate-spin" />
      </div>
    );
  }

  const formatDate = (d) => {
    const date = new Date(d);
    return {
      month: date.toLocaleString('en', { month: 'short' }).toUpperCase(),
      day: date.getDate(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleDateString()
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">University Events</h1>
          <p className="text-sm mt-1" style={{ color:'rgba(241,245,249,0.55)' }}>Connect, learn, and grow with your alumni network.</p>
        </div>
        <div className="glass-card rounded-full px-4 py-2.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm" style={{ color:'rgba(241,245,249,0.45)' }}>search</span>
          <input className="bg-transparent border-none outline-none text-sm w-44 text-white placeholder:text-slate-500" placeholder="Search events..." />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all"
            style={filter === f
              ? { background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', boxShadow:'0 4px 15px rgba(37,99,235,0.35)' }
              : { background:'rgba(255,255,255,0.07)', color:'rgba(241,245,249,0.65)', border:'1px solid rgba(255,255,255,0.10)' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {/* Hero Event */}
      {heroEvent && (
        <div className="glass-card rounded-2xl overflow-hidden relative group" style={{ minHeight: '320px' }}>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${heroEvent.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80'})`,
              filter: 'brightness(0.4)'
            }}
          />
          <div className="absolute inset-0" style={{ background:'linear-gradient(to top,rgba(0,0,0,0.85) 0%,transparent 60%)' }} />

          {/* Badge */}
          <div className="absolute top-5 left-5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background:'linear-gradient(135deg,#2563eb,#7c3aed)', color:'#fff', boxShadow:'0 4px 15px rgba(37,99,235,0.4)' }}>
              ⭐ Featured Event
            </span>
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background:'rgba(255,255,255,0.15)', color:'#fff', backdropFilter:'blur(8px)' }}>
                {formatDate(heroEvent.date).full}
              </span>
              <span className="text-xs" style={{ color:'rgba(255,255,255,0.7)' }}>
                🕐 {formatDate(heroEvent.date).time}
              </span>
              <span className="text-xs" style={{ color:'rgba(255,255,255,0.7)' }}>
                📍 {heroEvent.location || 'Online'}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{heroEvent.title}</h2>
            <p className="text-sm mb-4 max-w-2xl" style={{ color:'rgba(255,255,255,0.70)' }}>{heroEvent.description}</p>
            <div className="flex items-center gap-4">
              <button className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105" style={{ background:'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow:'0 4px 20px rgba(37,99,235,0.4)' }}>
                RSVP Now
              </button>
              <span className="text-sm" style={{ color:'rgba(255,255,255,0.60)' }}>
                {heroEvent.attendees?.length || 0} attending
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grid of remaining events */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">More Events</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {gridEvents.length > 0 ? gridEvents.map((evt) => {
            const d = formatDate(evt.date);
            return (
              <div key={evt._id} className="glass-card rounded-2xl overflow-hidden group cursor-pointer">
                <div className="h-36 relative overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage:`url(${evt.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80'})`, filter:'brightness(0.5)' }}
                  />
                  <div className="absolute inset-0" style={{ background:'linear-gradient(to top,rgba(0,0,0,0.7),transparent)' }} />
                  <span className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full font-medium" style={{ background:'rgba(255,255,255,0.15)', color:'#fff', backdropFilter:'blur(8px)' }}>
                    {evt.platform || 'Event'}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 mb-2 text-xs" style={{ color:'#60a5fa' }}>
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {d.full} · {d.time}
                  </div>
                  <h3 className="font-semibold text-white mb-1 line-clamp-1">{evt.title}</h3>
                  <p className="text-xs mb-4 line-clamp-2" style={{ color:'rgba(241,245,249,0.55)' }}>{evt.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs flex items-center gap-1" style={{ color:'rgba(241,245,249,0.50)' }}>
                      <span className="material-symbols-outlined text-sm">group</span>
                      {evt.attendees?.length || 0} RSVP
                    </span>
                    <button className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-all hover:scale-105" style={{ background:'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                      Register
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-3 glass-card rounded-2xl p-12 text-center">
              <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color:'rgba(241,245,249,0.30)' }}>event</span>
              <p className="text-white font-medium">No upcoming events</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StitchEvents;
