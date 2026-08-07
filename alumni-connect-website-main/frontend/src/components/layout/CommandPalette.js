import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Home, User, Users, Briefcase, Calendar, MessageSquare, MessageCircle, Globe, Building2, Terminal, Layers, GitMerge, FileSearch, Sparkles, Activity, Trophy, Megaphone, LifeBuoy, Settings, ShieldAlert } from 'lucide-react';

const ACTIONS = [
  { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: Home, category: 'Main' },
  { id: 'profile', name: 'Profile', href: '/profile', icon: User, category: 'Main' },
  
  { id: 'network', name: 'Network', href: '/network', icon: Globe, category: 'Connect' },
  { id: 'businesses', name: 'Startups & Businesses', href: '/businesses', icon: Building2, category: 'Connect' },
  { id: 'mentorship', name: 'Mentorship', href: '/mentorship', icon: Users, category: 'Connect' },
  { id: 'tech-hub', name: 'Tech Hub', href: '/tech-hub', icon: Terminal, category: 'Connect' },
  { id: 'forum', name: 'Forum', href: '/forum', icon: MessageSquare, category: 'Connect' },
  { id: 'chat', name: 'Chat', href: '/chat', icon: MessageCircle, category: 'Connect' },
  
  { id: 'jobs', name: 'Jobs', href: '/jobs', icon: Briefcase, category: 'Opportunities' },
  { id: 'events', name: 'Events', href: '/events', icon: Calendar, category: 'Opportunities' },
  { id: 'projects', name: 'Projects', href: '/projects', icon: Layers, category: 'Opportunities' },
  { id: 'collab', name: 'Project Collab', href: '/project-collaboration', icon: GitMerge, category: 'Opportunities' },
  { id: 'resume', name: 'AI Resume Analyzer', href: '/resume', icon: FileSearch, category: 'Opportunities' },
  { id: 'mock', name: 'AI Mock Interview', href: '/mock-interview', icon: Sparkles, category: 'Opportunities' },
  
  { id: 'devpulse', name: 'DevPulse', href: '/devpulse', icon: Activity, category: 'Engagement' },
  { id: 'leaderboard', name: 'Leaderboard', href: '/leaderboard', icon: Trophy, category: 'Engagement' },
  
  { id: 'settings', name: 'Settings', href: '/settings', icon: Settings, category: 'Support' },
  { id: 'feedback', name: 'Feedback', href: '/feedback', icon: Megaphone, category: 'Support' },
  { id: 'help', name: 'Help Centre', href: '/help-centre', icon: LifeBuoy, category: 'Support' },
  { id: 'admin', name: 'Admin Console', href: '/admin', icon: ShieldAlert, category: 'Support' },
];

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
        setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredActions = query === '' 
    ? ACTIONS 
    : ACTIONS.filter((action) => 
        action.name.toLowerCase().includes(query.toLowerCase()) || 
        action.category.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleAction = (action) => {
    setIsOpen(false);
    navigate(action.href);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredActions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
    } else if (e.key === 'Enter' && filteredActions.length > 0) {
      e.preventDefault();
      handleAction(filteredActions[selectedIndex]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] pointer-events-none"
          >
            <div 
              className="w-full max-w-xl mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-large overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 bg-transparent text-gray-900 dark:text-white outline-none placeholder-gray-400 font-medium"
                  placeholder="Search pages, tools, or commands..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="hidden sm:flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-500">ESC</span>
                  <span className="text-xs text-gray-400">to close</span>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                {filteredActions.length === 0 ? (
                  <div className="py-14 text-center text-sm text-gray-500">
                    No results found for "{query}"
                  </div>
                ) : (
                  filteredActions.map((action, index) => {
                    const Icon = action.icon;
                    const isSelected = index === selectedIndex;
                    return (
                      <div
                        key={action.id}
                        className={`flex items-center px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => handleAction(action)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 transition-colors ${
                          isSelected ? 'bg-primary-100 dark:bg-primary-900/40' : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{action.name}</p>
                          <p className={`text-xs ${isSelected ? 'text-primary-400' : 'text-gray-500'}`}>{action.category}</p>
                        </div>
                        {isSelected && (
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary-500">Jump</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow-sm">↑↓</span> to navigate</span>
                  <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow-sm">↵</span> to select</span>
                </div>
                <span className="font-semibold">Alumnex Connect</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
