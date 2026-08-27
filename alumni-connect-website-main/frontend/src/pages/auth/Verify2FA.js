import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheck, Mail, Smartphone, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedOTP from '../../components/AnimatedOTP';

const Verify2FA = () => {
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [isLoading, setIsLoading] = useState(false);
  const [methodSent, setMethodSent] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { verify2FA, send2FA } = useAuth();

  const email = location.state?.email;
  const availableMethods = location.state?.availableMethods || ['email'];
  const initialMethodSent = location.state?.methodSent || '';

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
    if (initialMethodSent) {
      setMethodSent(initialMethodSent);
    }
  }, [email, navigate, initialMethodSent]);

  const handleSendOtp = async (method) => {
    setIsLoading(true);
    try {
      const result = await send2FA(email, method);
      if (result.success) {
        setMethodSent(method);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleVerify = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setStatus('loading');
    try {
      const result = await verify2FA(email, otp);
      if (result && result.success) {
        setStatus('success');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1800);
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!methodSent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 glass-card bg-white/80 dark:bg-gray-900/80 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl text-center"
        >
          <ShieldCheck className="mx-auto h-16 w-16 text-primary-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Select Verification Method</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            For enhanced security, we need to verify it's really you. Please select where to send the OTP.
          </p>

          <div className="mt-8 space-y-4">
            {availableMethods.includes('sms') && (
              <button
                onClick={() => handleSendOtp('sms')}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center text-gray-700 dark:text-gray-200">
                  <Smartphone className="w-5 h-5 mr-3" />
                  <span className="font-semibold">Send via SMS</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>
            )}
            
            {availableMethods.includes('email') && (
              <button
                onClick={() => handleSendOtp('email')}
                disabled={isLoading}
                className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center text-gray-700 dark:text-gray-200">
                  <Mail className="w-5 h-5 mr-3" />
                  <span className="font-semibold">Send via Email</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          
          <div className="mt-6">
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              Cancel and return to login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 glass-card bg-white/80 dark:bg-gray-900/80 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl"
      >
        <div className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary-500" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Two-Factor Auth</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We've sent a 6-digit code via {methodSent === 'sms' ? 'SMS' : 'Email'}.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <AnimatedOTP 
            status={status} 
            onChange={(val) => {
              setOtp(val);
              if (status === 'error') setStatus('idle');
            }}
            onClear={() => setOtp('')}
          />

          <div className="relative pt-2">
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-500 shadow-lg shadow-emerald-500/30"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Verified Successfully!
                </motion.div>
              ) : (
                <motion.button
                  key="submit"
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  whileHover={otp.length === 6 ? { scale: 1.02 } : {}}
                  whileTap={otp.length === 6 ? { scale: 0.98 } : {}}
                  className={`w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-300 ${
                    isLoading || otp.length !== 6
                      ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400'
                      : 'bg-gradient-to-r from-primary-600 to-alumni-600 hover:from-primary-500 hover:to-alumni-500 shadow-primary-500/25'
                  }`}
                >
                  {isLoading ? 'Verifying...' : 'Verify & Continue'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </form>

        <div className="mt-6 flex flex-col space-y-3 text-center text-sm border-t border-gray-100 dark:border-gray-800 pt-6">
          <button
            type="button"
            onClick={() => handleSendOtp(methodSent)}
            disabled={isLoading || status === 'success'}
            className="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 disabled:opacity-50"
          >
            Didn't receive the code? Resend
          </button>
          
          {availableMethods.length > 1 && (
            <button
              onClick={() => setMethodSent('')}
              className="font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Try another method
            </button>
          )}

          <Link to="/login" className="font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400">
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Verify2FA;
