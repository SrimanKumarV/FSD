import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedOTP
 * A reusable 6-box OTP input component with shake and success animations.
 * 
 * @param {string} status - 'idle', 'loading', 'success', 'error'
 * @param {function} onComplete - callback when exactly 6 digits are entered, passes the OTP string.
 * @param {function} onChange - callback on every keystroke, passes the current OTP string.
 * @param {function} onClear - optional callback when the input auto-clears on error.
 */
const AnimatedOTP = ({ status, onComplete, onChange, onClear }) => {
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  // Auto-clear on error state transition
  useEffect(() => {
    if (status === 'error') {
      const timer = setTimeout(() => {
        setOtpArray(['', '', '', '', '', '']);
        if (onClear) onClear();
        if (inputRefs.current[0]) inputRefs.current[0].focus();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, onClear]);

  // Focus first on mount
  useEffect(() => {
    if (inputRefs.current[0] && status === 'idle') {
      inputRefs.current[0].focus();
    }
  }, []); // eslint-disable-line

  const triggerChange = (newArray) => {
    setOtpArray(newArray);
    const otpString = newArray.join('');
    if (onChange) onChange(otpString);
    if (otpString.length === 6 && onComplete) onComplete(otpString);
  };

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (isNaN(value)) return;
    
    const newOtp = [...otpArray];
    newOtp[index] = value.substring(value.length - 1); // Get last typed character
    
    triggerChange(newOtp);

    // Auto-focus next
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
    
    triggerChange(newOtp);
    
    const focusIndex = Math.min(pastedData.length, 5);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }
  };

  return (
    <motion.div
      animate={status === 'error' ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="flex justify-between gap-2 sm:gap-3 w-full max-w-sm mx-auto"
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
          className={`w-10 h-12 sm:w-12 sm:h-14 lg:w-14 lg:h-16 text-center text-xl sm:text-2xl font-black rounded-xl sm:rounded-2xl border-2 transition-all duration-300 outline-none
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
  );
};

export default AnimatedOTP;
