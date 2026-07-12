import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Trash2, ShieldAlert, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DevProfileSettings from '../components/profile/DevProfileSettings';

const Settings = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLanguageChange = (e) => {
    const langCode = e.target.value;
    const selectElement = document.querySelector('.goog-te-combo');
    if (selectElement) {
      selectElement.value = langCode;
      selectElement.dispatchEvent(new Event('change'));
      toast.success('Language updated!');
    } else {
      toast.error('Translation service is still loading or unavailable.');
    }
  };

  // State for Account Deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // State for Password Change
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const requestPasswordOtp = async () => {
    try {
      setIsRequestingOtp(true);
      await api.post('/auth/forgot-password', { email: user.email });
      setShowPasswordModal(true);
      toast.success('Security code sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send security code');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const confirmPasswordChange = async () => {
    if (!passwordOtp || passwordOtp.length !== 6) {
      toast.error('Please enter a valid 6-digit security code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    
    try {
      setIsChangingPassword(true);
      await api.post('/auth/reset-password', { 
        email: user.email, 
        otp: passwordOtp, 
        newPassword: newPassword 
      });
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordOtp('');
      setNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };



  const requestDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      await api.post('/users/delete-request');
      setShowDeleteModal(true);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setDeletingAccount(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!deleteOtp) {
      toast.error('Please enter the OTP');
      return;
    }
    try {
      setDeletingAccount(true);
      await api.delete('/users/me', { data: { otp: deleteOtp } });
      toast.success('Account deleted successfully');
      setShowDeleteModal(false);
      logout();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            Settings & Preferences
          </h2>
        </div>

        <div className="p-6 space-y-8">
          {/* Theme Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Appearance</h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Theme Preference</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between Light and Dark mode.</p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-5 h-5 text-yellow-500" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5 text-gray-600" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>
            {/* Language Switcher */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="mb-4 md:mb-0">
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary-500" />
                  Language
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Instantly translate the entire platform.</p>
              </div>
              <select
                onChange={handleLanguageChange}
                className="px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-white font-medium outline-none transition-all shadow-sm cursor-pointer min-w-[200px]"
                defaultValue="en"
              >
                <option value="en">English (Default)</option>
                <option value="es">Español (Spanish)</option>
                <option value="fr">Français (French)</option>
                <option value="de">Deutsch (German)</option>
                <option value="zh-CN">中文 (Chinese Simplified)</option>
                <option value="ja">日本語 (Japanese)</option>
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="ar">العربية (Arabic)</option>
                <option value="ru">Русский (Russian)</option>
                <option value="pt">Português (Portuguese)</option>
                <option value="it">Italiano (Italian)</option>
                <option value="ko">한국어 (Korean)</option>
              </select>
            </div>
          </div>

          {/* DevPulse Integrations */}
          <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <DevProfileSettings />
          </div>

          {/* Security & Authentication */}
          <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2 text-primary-500" />
              Security & Authentication
            </h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Securely update your password. We will send a confirmation code to <strong>{user?.email}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestPasswordOtp}
                  disabled={isRequestingOtp}
                  className="mt-4 md:mt-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center shadow-sm"
                >
                  {isRequestingOtp && !showPasswordModal ? 'Sending Code...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
              <Trash2 className="w-5 h-5 mr-2" />
              Danger Zone
            </h3>
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
              <p className="font-medium text-gray-900 dark:text-white">Delete Account</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                Once you delete your account, there is no going back. All your posts, messages, connections, and personal data will be permanently erased.
              </p>
              <button
                type="button"
                onClick={requestDeleteAccount}
                disabled={deletingAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center shadow-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {deletingAccount && !showDeleteModal ? 'Sending OTP...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Account Deletion</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
              We've sent an OTP to your email. Please enter it below to permanently delete your account. This action cannot be undone.
            </p>
            <input
              type="text"
              value={deleteOtp}
              onChange={(e) => setDeleteOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6 text-center text-2xl tracking-widest bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
              maxLength={6}
            />
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteOtp('');
                }}
                disabled={deletingAccount}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteAccount}
                disabled={deletingAccount || !deleteOtp || deleteOtp.length !== 6}
                className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center shadow-sm"
              >
                {deletingAccount ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verify Identity</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
              We've sent a 6-digit security code to <strong>{user?.email}</strong>. Please enter it below along with your new password.
            </p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Security Code (OTP)</label>
                <input
                  type="text"
                  value={passwordOtp}
                  onChange={(e) => setPasswordOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-xl tracking-widest bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                  maxLength={6}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordOtp('');
                  setNewPassword('');
                }}
                disabled={isChangingPassword}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPasswordChange}
                disabled={isChangingPassword || passwordOtp.length !== 6 || newPassword.length < 6}
                className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center shadow-sm"
              >
                {isChangingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Settings;
