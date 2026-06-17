import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Key, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  
  // Get email from location state (passed from Register or Login)
  const email = location.state?.email || '';

  if (!email) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyEmail(email, otp);
      if (result.success) {
        navigate('/dashboard', { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400/20 dark:bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="max-w-md w-full space-y-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We've sent a 6-digit verification code to <br />
            <strong className="text-gray-900 dark:text-white">{email}</strong>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card bg-white/80 dark:bg-gray-900/80 py-8 px-6 shadow-2xl rounded-3xl"
        >
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Verification Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="glass-input block w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none transition-all text-center tracking-widest text-lg font-bold"
                  placeholder="000000"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className={`w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-300 ${isLoading || otp.length < 6
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 to-alumni-600 hover:from-primary-500 hover:to-alumni-500'
                }`}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400 transition-colors">
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmail;
