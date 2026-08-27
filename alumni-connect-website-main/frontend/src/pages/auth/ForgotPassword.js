import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, AlertCircle, Key, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AnimatedOTP from '../../components/AnimatedOTP';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [otpStatus, setOtpStatus] = useState('idle'); // For AnimatedOTP
  
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors }
  } = useForm();

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
    setValue: setResetValue,
    watch: watchReset
  } = useForm();
  
  const currentOtp = watchReset('otp') || '';

  const onEmailSubmit = async (data) => {
    setIsLoading(true);
    setSuccessMessage('');
    try {
      const result = await forgotPassword(data.email);
      if (result.success) {
        setEmail(data.email);
        setStep(2);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data) => {
    setIsLoading(true);
    setOtpStatus('loading');
    try {
      const result = await resetPassword(email, data.otp, data.newPassword);
      if (result && result.success) {
        setOtpStatus('success');
        setSuccessMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setOtpStatus('error');
      }
    } catch (error) {
      console.error(error);
      setOtpStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400/20 dark:bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-alumni-400/20 dark:bg-alumni-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Link to="/" className="inline-flex items-center gap-3">
            <img loading="lazy" src="/logo.png" alt="Logo" className="w-12 h-12 rounded-full shadow-md" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-alumni-600 bg-clip-text text-transparent drop-shadow-sm">
              Alumnex Connect
            </h1>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
            {step === 1 
              ? "Enter your email to receive a verification code" 
              : "Enter the 6-digit code and your new password"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-card bg-white/80 dark:bg-gray-900/80 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl"
        >
          {successMessage ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">{successMessage}</h3>
            </div>
          ) : step === 1 ? (
            <form className="space-y-6" onSubmit={handleEmailSubmit(onEmailSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    {...registerEmail('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address'
                      }
                    })}
                    className={`glass-input block w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none transition-all ${emailErrors.email ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                    placeholder="Enter your registered email"
                  />
                </div>
                {emailErrors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {emailErrors.email.message}
                  </p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-300 ${isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-alumni-600 hover:from-primary-500 hover:to-alumni-500'
                  }`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Send Verification Code
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                )}
              </motion.button>
            </form>
          ) : (
            <form className="space-y-8" onSubmit={handleResetSubmit(onResetSubmit)}>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label htmlFor="otp" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Verification Code
                  </label>
                  <AnimatePresence>
                    {(resetErrors.otp || otpStatus === 'error') && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-bold text-red-500 flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" /> {resetErrors.otp ? resetErrors.otp.message : 'Wrong Code'}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Hidden input for react-hook-form validation */}
                <input
                  type="hidden"
                  {...registerReset('otp', {
                    required: 'Verification code is required',
                    minLength: { value: 6, message: 'Code must be 6 digits' }
                  })}
                />
                
                <AnimatedOTP 
                  status={otpStatus} 
                  onChange={(val) => {
                    setResetValue('otp', val, { shouldValidate: true });
                    if (otpStatus === 'error') setOtpStatus('idle');
                  }}
                  onClear={() => setResetValue('otp', '', { shouldValidate: true })}
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="newPassword"
                    type="password"
                    {...registerReset('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    disabled={isLoading || otpStatus === 'success'}
                    className={`glass-input block w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none transition-all ${resetErrors.newPassword ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                    placeholder="Enter new password"
                  />
                </div>
                {resetErrors.newPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {resetErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="relative pt-2">
                <AnimatePresence mode="wait">
                  {otpStatus === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-emerald-500 shadow-lg shadow-emerald-500/30"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Reset Successfully!
                    </motion.div>
                  ) : (
                    <motion.button
                      key="submit"
                      type="submit"
                      disabled={isLoading || currentOtp.length !== 6}
                      whileHover={currentOtp.length === 6 ? { scale: 1.02 } : {}}
                      whileTap={currentOtp.length === 6 ? { scale: 0.98 } : {}}
                      className={`w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-300 ${
                        isLoading || currentOtp.length !== 6
                          ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400'
                          : 'bg-gradient-to-r from-primary-600 to-alumni-600 hover:from-primary-500 hover:to-alumni-500 shadow-primary-500/25'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Resetting...
                        </div>
                      ) : (
                        'Reset Password'
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              Back to Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
