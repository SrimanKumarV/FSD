import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DevProfileSettings from '../components/profile/DevProfileSettings';

const Settings = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

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
          </div>

          {/* DevPulse Integrations */}
          <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <DevProfileSettings />
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-2" />
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
    </div>
  );
};

export default Settings;
