import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Search, 
  Zap, 
  ArrowRight
} from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const faqs = [
    // ── Activity Hub & Activity Intelligence ──
    {
      category: 'activity',
      question: "What is the Activity Hub and how does it work?",
      answer: "The Activity Hub is Alumnex's automated career momentum and habit intelligence system. It tracks your daily progress across Coding, Learning, Projects, and Career, provides personalized insights, calculates consistency streaks, and helps you maintain steady habits through intelligent, timezone-aware reminders."
    },
    {
      category: 'activity',
      question: "How does automated platform tracking verify my coding activity?",
      answer: "When you link developer accounts such as GitHub, LeetCode, or Codeforces, Alumnex periodically scans your public activity feeds (commit history, problem submissions, contest ratings). Any detected progress is automatically verified and applied to your matching daily goals without requiring manual check-ins."
    },
    {
      category: 'activity',
      question: "How are streaks calculated and what is Streak Protection?",
      answer: "Your overall streak increases by 1 day when you complete at least one verified activity or goal during your local activity day. Streak Protection gives you real-time visibility into whether your streak is already secured for today or at risk. If you haven't logged activity by the evening, Alumnex alerts you before your timezone boundary resets."
    },
    {
      category: 'activity',
      question: "What is the Consistency Index (Score)?",
      answer: "Your Consistency Index (0–100) measures habit durability over 7-day to 1-year evaluation windows. It weights active days (50%), daily goal execution percentage (30%), and streak continuity (20%) to give you an objective measure of long-term discipline."
    },
    {
      category: 'activity',
      question: "Can I log goals manually if I don't use connected developer platforms?",
      answer: "Yes! Every habit goal supports manual completion. You can create custom goals for course lectures, system design reading, or project milestones, and check them off with one click from Today's Action Plan."
    },
    {
      category: 'activity',
      question: "How does timezone detection and Quiet Hours work?",
      answer: "Activity Hub detects your browser timezone automatically (e.g., Asia/Kolkata, America/New_York) to ensure day boundaries and resets align precisely with your local clock. You can also configure Quiet Hours in Settings to pause all notifications while you sleep."
    },

    // ── Platform & Mentorship ──
    {
      category: 'mentorship',
      question: "What is Alumnex Connect?",
      answer: "Alumnex Connect is a dedicated platform designed to bridge the gap between current students and alumni. It facilitates mentorship, networking, career guidance, and provides a forum for discussion and collaboration."
    },
    {
      category: 'mentorship',
      question: "How do I join the mentorship program?",
      answer: "Once registered and logged in, navigate to the 'Mentorship' section. Students can browse alumni profiles and send mentorship requests. Alumni can also browse student profiles to offer guidance and schedule 1:1 sessions."
    },

    // ── Jobs & Opportunities ──
    {
      category: 'jobs',
      question: "How can I post a job or internship?",
      answer: "If you are registered as an Alumni, you can navigate to the 'Jobs' section and click on the 'Post a Job' button. You'll need to provide details about the role, company, and application process."
    },

    // ── Account & Privacy ──
    {
      category: 'account',
      question: "Can I update my profile information later?",
      answer: "Absolutely. You can update your profile information, including your bio, current company, role, and developer accounts, at any time by visiting your Profile or Settings."
    },
    {
      category: 'account',
      question: "Is Alumnex Connect free to use?",
      answer: "Yes, core features of Alumnex Connect including Mentorship, Activity Intelligence, Job Board, and DevPulse are completely free for students and alumni of the institution."
    }
  ];

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'activity', label: '⚡ Activity Hub & Streaks' },
    { id: 'mentorship', label: 'Mentorship' },
    { id: 'jobs', label: 'Jobs & Careers' },
    { id: 'account', label: 'Account & Security' }
  ];

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const matchesSearch = 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqs, selectedCategory, searchQuery]);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex p-3.5 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-4">
              <HelpCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3">
              Frequently Asked Questions
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Learn how Alumnex Connect, Activity Intelligence, Mentorship, and Careers work together.
            </p>

            {/* Search Input */}
            <div className="mt-6 max-w-xl mx-auto relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm text-sm"
                placeholder="Search questions about Activity Hub, Streaks, Mentorship..."
              />
            </div>
          </div>

          {/* Activity Hub Feature Highlight Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-amber-500/10 border border-indigo-200 dark:border-indigo-800/60 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 flex-shrink-0">
                <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span>New: Activity Hub is Live!</span>
                  <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-white">v2.0</span>
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Automate daily habit tracking from GitHub & LeetCode, protect your streaks, and build consistent career momentum.
                </p>
              </div>
            </div>

            <Link
              to="/activity"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0"
            >
              <span>Explore Activity Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setOpenIndex(0);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Questions Accordion */}
          {filteredFaqs.length > 0 ? (
            <div className="space-y-3.5">
              {filteredFaqs.map((faq, index) => (
                <div 
                  key={index} 
                  className={`bg-white dark:bg-gray-800/80 rounded-2xl border transition-all duration-200 ${
                    openIndex === index 
                      ? 'border-primary-500 shadow-sm' 
                      : 'border-gray-200 dark:border-gray-700/70 hover:border-gray-300'
                  }`}
                >
                  <button
                    className="w-full px-5 py-4 sm:px-6 sm:py-4.5 flex justify-between items-center text-left focus:outline-none gap-3"
                    onClick={() => toggleFaq(index)}
                  >
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      {faq.question}
                    </span>
                    {openIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 sm:px-6 sm:pb-5 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700/40 pt-3">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No matching questions found</p>
              <p className="text-xs text-gray-500 mt-1">Try searching for other terms or choose "All Questions".</p>
            </div>
          )}

          {/* Contact Support Footer */}
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Still have questions?{' '}
              <Link to="/contact" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
                Contact our support team
              </Link>
              .
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
