import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Github, Code2, Terminal, Code, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const DevProfileSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [usernames, setUsernames] = useState({
    github: { username: '', isVerified: false },
    leetcode: { username: '', isVerified: false },
    hackerrank: { username: '', isVerified: false },
    gfg: { username: '', isVerified: false }
  });

  const [verificationCode, setVerificationCode] = useState('');

  const { data, isLoading } = useQuery(
    ['dev-activity', user?.email],
    () => api.get(`/dev-activity/${user?.email}`),
    {
      enabled: !!user?.email,
      retry: false,
      onSuccess: (res) => {
        if (res.data?.usernames) {
          setUsernames({
            github: res.data.usernames.github || { username: '', isVerified: false },
            leetcode: res.data.usernames.leetcode || { username: '', isVerified: false },
            hackerrank: res.data.usernames.hackerrank || { username: '', isVerified: false },
            gfg: res.data.usernames.gfg || { username: '', isVerified: false }
          });
        }
      },
      onError: (err) => {
        if (err.response?.status !== 404) {
          console.error('Error fetching dev profile:', err);
        }
      }
    }
  );

  const saveMutation = useMutation(
    (newSettings) => api.post('/dev-activity/usernames', {
      github: newSettings.github.username,
      leetcode: newSettings.leetcode.username,
      hackerrank: newSettings.hackerrank.username,
      gfg: newSettings.gfg.username
    }),
    {
      onSuccess: (res) => {
        toast.success('Developer usernames saved successfully');
        queryClient.invalidateQueries(['dev-activity', user?.email]);
        if (res.data?.usernames) {
          setUsernames(res.data.usernames);
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to save settings');
      }
    }
  );

  const generateCodeMutation = useMutation(
    () => api.post('/dev-activity/generate-code'),
    {
      onSuccess: (res) => {
        setVerificationCode(res.data.verificationCode);
        toast.success('Verification code generated!');
      },
      onError: (error) => {
        toast.error('Failed to generate code');
      }
    }
  );

  const verifyPlatformMutation = useMutation(
    (platform) => api.post('/dev-activity/verify-platform', { platform }),
    {
      onSuccess: (res, platform) => {
        toast.success(res.data.message);
        queryClient.invalidateQueries(['dev-activity', user?.email]);
        setUsernames(res.data.usernames);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Verification failed');
      }
    }
  );

  const handleChange = (e) => {
    setUsernames({
      ...usernames,
      [e.target.name]: { ...usernames[e.target.name], username: e.target.value }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(usernames);
  };

  if (isLoading && !data) {
    return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-64 rounded-xl"></div>;
  }

  const renderPlatformInput = (platformKey, icon, label, placeholder) => {
    const isVerified = usernames[platformKey]?.isVerified;
    return (
      <div className="space-y-2 border p-4 rounded-xl dark:border-gray-700 bg-white dark:bg-gray-800">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
          <span className="flex items-center">
            {icon} {label}
          </span>
          {isVerified ? (
            <span className="flex items-center text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3 mr-1" /> Verified
            </span>
          ) : (
            <span className="flex items-center text-xs font-medium text-gray-400">
              Unverified
            </span>
          )}
        </label>
        
        <div className="flex gap-2">
          <input
            type="text"
            name={platformKey}
            value={usernames[platformKey]?.username || ''}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={isVerified}
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
          />
          {!isVerified && usernames[platformKey]?.username && (
            <button
              type="button"
              onClick={() => verifyPlatformMutation.mutate(platformKey)}
              disabled={verifyPlatformMutation.isLoading || !verificationCode}
              className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center"
            >
              {verifyPlatformMutation.isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">DevPulse Integrations</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Link your coding profiles to track your Alumnex Score. To verify a profile, generate a code, paste it into your public bio on that platform, and click Verify.
      </p>

      {/* Verification Code Section */}
      <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800 rounded-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-primary-900 dark:text-primary-100">Bio Verification</h4>
            <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
              {verificationCode 
                ? "Paste this exact code anywhere in your public bio/summary:" 
                : "Generate a unique code to prove ownership of your accounts."}
            </p>
          </div>
          {verificationCode ? (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-primary-200 dark:border-primary-700">
              <code className="text-lg font-mono font-bold text-primary-600 dark:text-primary-400">{verificationCode}</code>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => generateCodeMutation.mutate()}
              disabled={generateCodeMutation.isLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              {generateCodeMutation.isLoading ? 'Generating...' : 'Generate Code'}
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderPlatformInput('github', <Github className="w-4 h-4 mr-2" />, 'GitHub', 'e.g. octocat')}
          {renderPlatformInput('leetcode', <Code2 className="w-4 h-4 mr-2" />, 'LeetCode', 'e.g. alex123')}
          {renderPlatformInput('hackerrank', <Terminal className="w-4 h-4 mr-2" />, 'HackerRank', 'e.g. john_doe')}
          {renderPlatformInput('gfg', <Code className="w-4 h-4 mr-2" />, 'GeeksforGeeks', 'e.g. coder_gfg')}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" /> Save usernames first, then verify them individually.
          </div>
          <button
            type="submit"
            disabled={saveMutation.isLoading}
            className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
          >
            {saveMutation.isLoading ? 'Saving...' : 'Save Usernames'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DevProfileSettings;
