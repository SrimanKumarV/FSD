import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsConditions = () => {
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
          <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-700 pb-8">
            <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-2xl">
              <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms and Conditions</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Agreement to Terms</h2>
              <p>
                By viewing or using this website, you agree to be bound by all of these Terms and Conditions. If you disagree with any part of these terms and conditions, please do not use our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. User Accounts</h2>
              <p>
                When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
              </p>
              <p className="mt-2">
                You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Intellectual Property</h2>
              <p>
                The Service and its original content, features and functionality are and will remain the exclusive property of Alumnex Connect and its licensors. The Service is protected by copyright, trademark, and other laws of both the country and foreign countries.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Code of Conduct</h2>
              <p>
                Users agree not to engage in any of the following prohibited activities:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Harassing, abusing, or threatening others.</li>
                <li>Posting explicit, offensive, or illegal content.</li>
                <li>Attempting to interfere with the network or security of the Service.</li>
                <li>Impersonating any person or entity.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Limitation of Liability</h2>
              <p>
                In no event shall Alumnex Connect, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsConditions;
