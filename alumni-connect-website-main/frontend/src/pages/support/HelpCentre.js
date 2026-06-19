import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, LifeBuoy, Search, BookOpen, MessageCircle } from 'lucide-react';

const HelpCentre = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-3xl p-8 md:p-12 shadow-xl"
        >
          <div className="flex flex-col items-center text-center mb-12">
            <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-6">
              <LifeBuoy className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How can we help you?</h1>
            <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl">
              Search our knowledge base or browse categories below to find the answers you need.
            </p>
            
            <div className="mt-8 w-full max-w-xl relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="text"
                className="glass-input block w-full pl-12 pr-4 py-4 rounded-xl text-lg focus:outline-none transition-all shadow-sm"
                placeholder="Search for articles, tutorials, or guides..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <Link to="/faq" className="block p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all group bg-white dark:bg-gray-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">FAQs</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Find quick answers to the most common questions about using Alumnex Connect.
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/contact" className="block p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md transition-all group bg-white dark:bg-gray-800">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Contact Support</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Can't find what you're looking for? Reach out to our friendly support team directly.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpCentre;
