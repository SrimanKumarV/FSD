import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  Building,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    graduationYear: '',
    company: '',
    position: '',
    bio: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 20 }, (_, i) => currentYear - i);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'student' && !formData.graduationYear) {
      newErrors.graduationYear = 'Graduation year is required for students';
    }

    if (formData.role === 'alumni' && !formData.company.trim()) {
      newErrors.company = 'Company is required for alumni';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(formData);
      if (result.requiresVerification) {
        navigate('/verify-email', { state: { email: result.email } });
      } else if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      // AuthContext handles most errors and toasts
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.field] = err.message;
        });
        setErrors(prev => ({ ...prev, ...backendErrors }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[!@#$%^&*])/.test(password)) score++;

    const strengthMap = {
      0: { label: 'Very Weak', color: 'text-red-500' },
      1: { label: 'Weak', color: 'text-red-500' },
      2: { label: 'Fair', color: 'text-yellow-500' },
      3: { label: 'Good', color: 'text-blue-500' },
      4: { label: 'Strong', color: 'text-green-500' },
      5: { label: 'Very Strong', color: 'text-green-600' }
    };

    return { score, ...strengthMap[score] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="absolute top-[10%] left-[-10%] w-96 h-96 bg-primary-400/20 dark:bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-alumni-400/20 dark:bg-alumni-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <div className="flex justify-center items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-full shadow-md" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-alumni-600 bg-clip-text text-transparent drop-shadow-sm">
                Alumnex Connect
              </h1>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Create your account</h2>
            <p className="mt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              Join our community of students and alumni
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 glass-card bg-white/80 dark:bg-gray-900/80 py-8 px-4 sm:px-10 shadow-2xl rounded-3xl"
        >
          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
                Basic Information
              </h3>
              
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <div className="mt-2 relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className={`glass-input block w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all ${
                      errors.name ? 'border-red-400 ring-1 ring-red-400' : ''
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="mt-2 relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`glass-input block w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all ${
                      errors.email ? 'border-red-400 ring-1 ring-red-400' : ''
                    }`}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  I am a
                </label>
                <div className="mt-2">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="glass-input block w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
                  >
                    <option value="student">Student</option>
                    <option value="alumni">Alumni</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Role-specific Information */}
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
                {formData.role === 'student' ? 'Student Information' : 'Professional Information'}
              </h3>

              {formData.role === 'student' ? (
                <div>
                  <label htmlFor="graduationYear" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Expected Graduation Year
                  </label>
                  <div className="mt-2 relative">
                    <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      id="graduationYear"
                      name="graduationYear"
                      value={formData.graduationYear}
                      onChange={handleChange}
                      className={`glass-input block w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all ${
                        errors.graduationYear ? 'border-red-400 ring-1 ring-red-400' : ''
                      }`}
                    >
                      <option value="">Select graduation year</option>
                      {graduationYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  {errors.graduationYear && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.graduationYear}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="company" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Company
                    </label>
                    <div className="mt-2 relative">
                      <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="company"
                        name="company"
                        type="text"
                        value={formData.company}
                        onChange={handleChange}
                        className={`glass-input block w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all ${
                          errors.company ? 'border-red-400 ring-1 ring-red-400' : ''
                        }`}
                        placeholder="Enter company name"
                      />
                    </div>
                    {errors.company && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.company}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="position" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Position
                    </label>
                    <div className="mt-2">
                      <input
                        id="position"
                        name="position"
                        type="text"
                        value={formData.position}
                        onChange={handleChange}
                        className="glass-input block w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
                        placeholder="Enter your position"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Bio
                </label>
                <div className="mt-2">
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    className="glass-input block w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200/50 dark:border-gray-700/50 pb-2">
                Security
              </h3>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="mt-2 relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`glass-input block w-full pl-12 pr-12 py-3 rounded-xl focus:outline-none transition-all ${
                      errors.password ? 'border-red-400 ring-1 ring-red-400' : ''
                    }`}
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.password}
                  </p>
                )}
                {formData.password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">Password strength:</span>
                      <span className={`font-bold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          passwordStrength.score <= 1 ? 'bg-red-500' :
                          passwordStrength.score <= 2 ? 'bg-yellow-500' :
                          passwordStrength.score <= 3 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <div className="mt-2 relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`glass-input block w-full pl-12 pr-12 py-3 rounded-xl focus:outline-none transition-all ${
                      errors.confirmPassword ? 'border-red-400 ring-1 ring-red-400' : ''
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <p className="mt-2 text-sm font-bold text-green-600 dark:text-green-400 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-1" />
                    Passwords match
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all duration-300 ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary-600 to-alumni-600 hover:from-primary-500 hover:to-alumni-500'
                }`}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </button>
            </motion.div>

            {/* Terms and Login Link */}
            <div className="text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                  Privacy Policy
                </Link>
              </p>
              <p className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
