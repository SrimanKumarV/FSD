import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, MapPin, Send } from 'lucide-react';

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Get in Touch</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
              We'd love to hear from you. Please fill out this form or shoot us an email.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-2xl">
                  <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Our friendly team is here to help.</p>
                  <a href="mailto:support@alumnexconnect.com" className="text-primary-600 dark:text-primary-400 font-medium mt-2 inline-block">
                    support@alumnexconnect.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-2xl">
                  <Phone className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Phone</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Mon-Fri from 8am to 5pm.</p>
                  <p className="text-primary-600 dark:text-primary-400 font-medium mt-2">
                    +1 (555) 000-0000
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-2xl">
                  <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Office</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Come say hello at our office HQ.</p>
                  <p className="text-primary-600 dark:text-primary-400 font-medium mt-2">
                    100 Innovation Drive<br />Tech City, TC 10100
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card bg-white/80 dark:bg-gray-800/80 rounded-3xl p-8 shadow-xl"
          >
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">First name</label>
                  <input type="text" id="first-name" className="mt-2 glass-input block w-full px-4 py-3 rounded-xl focus:outline-none transition-all" placeholder="First name" />
                </div>
                <div>
                  <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last name</label>
                  <input type="text" id="last-name" className="mt-2 glass-input block w-full px-4 py-3 rounded-xl focus:outline-none transition-all" placeholder="Last name" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input type="email" id="email" className="mt-2 glass-input block w-full px-4 py-3 rounded-xl focus:outline-none transition-all" placeholder="you@example.com" />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                <textarea id="message" rows="4" className="mt-2 glass-input block w-full px-4 py-3 rounded-xl focus:outline-none transition-all resize-none" placeholder="Leave us a message..."></textarea>
              </div>

              <button type="button" className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-300 bg-primary-600 hover:bg-primary-700">
                <Send className="w-5 h-5 mr-2" />
                Send message
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
