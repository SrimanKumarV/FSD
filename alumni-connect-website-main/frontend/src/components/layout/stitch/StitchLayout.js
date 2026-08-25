import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import UserAvatar from '../../UserAvatar';

const StitchLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'home' },
    { name: 'Network', path: '/network', icon: 'group' },
    { name: 'Mentorship', path: '/mentorship', icon: 'psychology' },
    { name: 'DevPulse', path: '/devpulse', icon: 'insights', highlight: true },
    { name: 'Events', path: '/events', icon: 'calendar_month' },
    { name: 'Jobs', path: '/jobs', icon: 'work' },
    { name: 'Forum', path: '/forum', icon: 'forum' },
    { name: 'AI Mentor', path: '/resume', icon: 'smart_toy' }
  ];

  return (
    <div className="theme-stitch">
      {/* Mobile Top Nav */}
      <header className="md:hidden bg-glass-light backdrop-blur-md text-primary font-body-base fixed top-0 w-full z-50 border-b border-white/50 shadow-sm flex justify-between items-center px-4 h-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 mr-1">
            <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
          <div className="text-title-lg font-headline-md font-bold text-primary">Alumnex Connect</div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-full hover:bg-primary-container/10 transition-colors duration-200 scale-95 active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
          </button>
          <button className="p-2 rounded-full hover:bg-primary-container/10 transition-colors duration-200 scale-95 active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          </button>
        </div>
      </header>

      <div className="flex h-screen pt-16 md:pt-0">
        {/* Desktop / Mobile Drawer Sidebar */}
        <nav className={`bg-glass-light backdrop-blur-lg text-primary font-body-sm fixed left-0 top-0 h-full w-64 z-40 border-r border-white/50 shadow-primary-500/10 flex-col p-4 gap-2 transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:flex'}`}>
          <div className="mb-8 mt-4 px-4 flex justify-between items-center">
            <h1 className="text-headline-md font-headline-md font-extrabold text-primary">Alumnex Connect</h1>
            <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <Link to="/profile" className="flex items-center gap-2 mt-2 px-4 mb-6 hover:bg-surface-container-high rounded-xl py-2 transition-colors">
            <UserAvatar src={user?.photo} name={user?.name} className="w-8 h-8 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="font-body-bold text-on-surface text-sm line-clamp-1">{user?.name || 'User'}</span>
              <span className="text-caption-xs text-on-surface-variant capitalize">{user?.role || 'Guest'}</span>
            </div>
          </Link>

          <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
            {navItems.map(item => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 -translate-y-0.5 hover:shadow-md ${
                  isActive(item.path) 
                    ? 'bg-primary-container text-on-primary-container font-body-bold shadow-primary-500/20' 
                    : item.highlight 
                      ? 'bg-primary/10 text-primary hover:bg-primary-container hover:text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-white/30">
            {user?.role !== 'college' && (
              <Link to="/mentorship" className="w-full text-center bg-primary text-on-primary rounded-xl py-3 font-body-bold hover:bg-surface-tint shadow-primary-500/30 hover:shadow-lg transition-all mb-4">
                Find a Mentor
              </Link>
            )}
            <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 text-on-surface-variant hover:bg-surface-container-high transition-all duration-300 px-4 py-2 rounded-xl">
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </Link>
            <button onClick={logout} className="flex items-center gap-3 text-on-surface-variant hover:bg-error-container hover:text-error transition-all duration-300 px-4 py-2 rounded-xl text-left">
              <span className="material-symbols-outlined">logout</span>
              <span>Log out</span>
            </button>
          </div>
        </nav>

        {/* Overlay for mobile sidebar */}
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto h-[calc(100vh-4rem)] md:h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StitchLayout;
