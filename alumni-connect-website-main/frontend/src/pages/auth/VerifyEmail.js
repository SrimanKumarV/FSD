import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const VerifyEmail = () => {
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const inputRefs = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  
  const email = location.state?.email || '';

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  if (!email) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;
    
    const newOtp = [...otpArray];
    newOtp[index] = value.substring(value.length - 1);
    setOtpArray(newOtp);
    if (status === 'error') setStatus('idle');

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').substring(0, 6);
    if (!pastedData) return;
    
    const newOtp = [...otpArray];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpArray(newOtp);
    if (status === 'error') setStatus('idle');
    
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = otpArray.join('');
    if (otp.length < 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    setStatus('loading');
    try {
      const result = await verifyEmail(email, otp);
      if (result && result.success) {
        setStatus('success');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1800);
      } else {
        triggerError();
      }
    } catch (error) {
      triggerError();
    }
  };

  const triggerError = () => {
    setStatus('error');
    setTimeout(() => {
      setOtpArray(['', '', '', '', '', '']);
      setStatus('idle');
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    try {
      const response = await api.post('/auth/resend-verification', { email });
      if (response.data.success) {
        toast.success('A new OTP has been sent to your email.');
        setResendCooldown(60);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend OTP.';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  const isFull = otpArray.every(d => d !== '');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400/20 dark:bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-alumni-400/20 dark:bg-alumni-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center mb-6 shadow-inner border border-primary-200 dark:border-primary-800">
            <Mail className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Verify your email
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We've sent a 6-digit verification code to <br />
            <strong className="text-gray-900 dark:text-white">{email}</strong>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card bg-white/80 dark:bg-gray-900/80 py-8 px-6 sm:px-8 shadow-2xl rounded-3xl border border-gray-100 dark:border-gray-800 backdrop-blur-xl"
        >
          <form className="space-y-8" onSubmit={handleSubmit}>
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Verification Code
                </label>
                <AnimatePresence>
                  {status === 'error' && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-bold text-red-500 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" /> Wrong Code
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <motion.div
                animate={status === 'error' ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex justify-between gap-2 sm:gap-3"
              >
                {otpArray.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => inputRefs.current[index] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={status === 'loading' || status === 'success'}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-2xl border-2 transition-all duration-300 outline-none
                      ${status === 'success' 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' 
                        : status === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-400 text-red-600 dark:text-red-400'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20'
                      }
                      ${digit && status !== 'error' && status !== 'success' ? 'border-primary-400' : ''}
                    `}
                  />
                ))}
              </motion.div>
            </div>

            <div className="relative">
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
                    disabled={status === 'loading' || !isFull}
                    whileHover={isFull ? { scale: 1.02 } : {}}
                    whileTap={isFull ? { scale: 0.98 } : {}}
                    className={`w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-300 ${
                      status === 'loading' || !isFull
                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400'
                        : 'bg-gradient-to-r from-primary-600 to-alumni-600 hover:from-primary-500 hover:to-alumni-500 shadow-primary-500/25'
                    }`}
                  >
                    {status === 'loading' ? (
                      <div className="flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verifying...
                      </div>
                    ) : (
                      'Verify & Continue'
                    )}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Didn't receive the code?</p>
            
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0 || status === 'success'}
              className={`inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                isResending || resendCooldown > 0 || status === 'success'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed border border-gray-200 dark:border-gray-700'
                  : 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 border border-primary-200 dark:border-primary-800'
              }`}
            >
              {resendCooldown > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse mr-2" />
                  Resend available in <span className="w-6 text-center tabular-nums font-black ml-1">{resendCooldown}s</span>
                </>
              ) : isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sending...
                </>
              ) : (
                'Resend Verification Code'
              )}
            </button>
            
            <Link to="/login" className="text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors mt-2">
              Back to Login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmail;

