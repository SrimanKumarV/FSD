import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, Users, Briefcase, Calendar } from 'lucide-react';

const NotFound = () => {
  const quickLinks = [
    { name: 'Home', href: '/', icon: Home, description: 'Return to homepage' },
    { name: 'Dashboard', href: '/dashboard', icon: Users, description: 'Access your dashboard' },
    { name: 'Jobs', href: '/jobs', icon: Briefcase, description: 'Browse job opportunities' },
    { name: 'Events', href: '/events', icon: Calendar, description: 'View upcoming events' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          {/* 404 Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            className="mx-auto h-24 w-24 text-gray-400 mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl font-bold text-gray-300">4</div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-8 border-gray-300 rounded-full"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-bold text-gray-400">0</div>
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
            <p className="text-gray-600 mb-8">
              Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
          >
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="group p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-primary-100 transition-colors">
                        <Icon className="w-5 h-5 text-gray-600 group-hover:text-primary-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 group-hover:text-primary-900">
                          {link.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {link.description}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-500 mb-2">
              Still having trouble? Try searching for what you're looking for:
            </p>
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search the site..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
