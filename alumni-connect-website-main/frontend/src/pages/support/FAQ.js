import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "What is Alumnex Connect?",
      answer: "Alumnex Connect is a dedicated platform designed to bridge the gap between current students and alumni. It facilitates mentorship, networking, career guidance, and provides a forum for discussion and collaboration."
    },
    {
      question: "How do I join the mentorship program?",
      answer: "Once registered and logged in, navigate to the 'Mentorship' section. Students can browse alumni profiles and send mentorship requests. Alumni can also browse student profiles to offer guidance."
    },
    {
      question: "Is Alumnex Connect free to use?",
      answer: "Yes, the basic features of Alumnex Connect are completely free for both students and alumni of the institution."
    },
    {
      question: "How can I post a job or internship?",
      answer: "If you are registered as an Alumni, you can navigate to the 'Jobs' section and click on the 'Post a Job' button. You'll need to provide details about the role, company, and application process."
    },
    {
      question: "Can I update my profile information later?",
      answer: "Absolutely. You can update your profile information, including your bio, current company, and role, at any time by going to the 'Profile' section and clicking 'Edit Profile'."
    }
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-12">
            <div className="inline-flex p-4 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-6">
              <HelpCircle className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Find answers to common questions about using our platform.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`glass-card bg-white/80 dark:bg-gray-800/80 rounded-2xl border transition-all duration-200 ${
                  openIndex === index ? 'border-primary-500 shadow-md' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <button
                  className="w-full px-6 py-5 flex justify-between items-center text-left focus:outline-none"
                  onClick={() => toggleFaq(index)}
                >
                  <span className="text-lg font-medium text-gray-900 dark:text-white">{faq.question}</span>
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
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-gray-600 dark:text-gray-400">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Still have questions? <Link to="/contact" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Contact our support team</Link>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQ;
