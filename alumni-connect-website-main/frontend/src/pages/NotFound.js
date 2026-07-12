import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Users, Briefcase, Calendar, MessageSquare } from 'lucide-react';

const NotFound = () => {
  const quickLinks = [
    { name: 'Forum', href: '/forum', icon: MessageSquare, description: 'Join the discussion' },
    { name: 'Dashboard', href: '/dashboard', icon: Users, description: 'Access your dashboard' },
    { name: 'Jobs', href: '/jobs', icon: Briefcase, description: 'Browse job opportunities' },
    { name: 'Events', href: '/events', icon: Calendar, description: 'View upcoming events' }
  ];

  return (
    <main className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-slate-900">
      
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl translate-y-1/2"></div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="text-center">
          
          {/* 404 Visual */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex justify-center items-center gap-4 mb-8"
          >
            <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-400">4</div>
            <div className="w-24 h-24 rounded-full border-8 border-slate-700 relative overflow-hidden flex items-center justify-center bg-slate-800 shadow-inner">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-cyan-500/30"
              />
              <div className="w-12 h-12 rounded-full bg-slate-900 z-10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
            </div>
            <div className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-400">4</div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-white mb-3">Page Not Found</h1>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
              We explored deep into the servers but couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link
              to="/"
              className="inline-flex justify-center items-center px-6 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25"
            >
              <Home className="w-5 h-5 mr-2" />
              Return Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex justify-center items-center px-6 py-3.5 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50"
          >
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Quick Destinations</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 text-left"
                  >
                    <div className="p-3 rounded-xl bg-slate-800 group-hover:bg-indigo-500/20 transition-colors">
                      <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <div>
                      <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {link.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {link.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
