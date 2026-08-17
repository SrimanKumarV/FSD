import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { CheckCircle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import PlatformIcon from '../PlatformIcon';

const DevProfileSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [usernames, setUsernames] = useState({
    github: { username: '', isVerified: false },
    leetcode: { username: '', isVerified: false },
    hackerrank: { username: '', isVerified: false },
    gfg: { username: '', isVerified: false },
    codechef: { username: '', isVerified: false },
    codeforces: { username: '', isVerified: false },
    duolingo: { username: '', isVerified: false }
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
            gfg: res.data.usernames.gfg || { username: '', isVerified: false },
            codechef: res.data.usernames.codechef || { username: '', isVerified: false },
            codeforces: res.data.usernames.codeforces || { username: '', isVerified: false },
            duolingo: res.data.usernames.duolingo || { username: '', isVerified: false }
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
      github: newSettings.github?.username || '',
      leetcode: newSettings.leetcode?.username || '',
      hackerrank: newSettings.hackerrank?.username || '',
      gfg: newSettings.gfg?.username || '',
      codechef: newSettings.codechef?.username || '',
      codeforces: newSettings.codeforces?.username || '',
      duolingo: newSettings.duolingo?.username || ''
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
    (platform) => api.post('/dev-activity/verify-platform', { 
      platform, 
      username: usernames[platform]?.username 
    }),
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
      [e.target.name]: { ...usernames[e.target.name], username: e.target.value, isVerified: false }
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
            <span className="flex items-center text-xs font-medium text-gray-500">
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
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
          />
          {isVerified && (
            <button
              type="button"
              onClick={() => {
                setUsernames({
                  ...usernames,
                  [platformKey]: { ...usernames[platformKey], isVerified: false }
                });
              }}
              className="px-4 py-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-400 rounded-lg text-sm font-medium transition-colors"
            >
              Edit
            </button>
          )}
          {!isVerified && usernames[platformKey]?.username && (
            <button
              type="button"
              onClick={() => verifyPlatformMutation.mutate(platformKey)}
              disabled={verifyPlatformMutation.isLoading}
              className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center"
            >
              {verifyPlatformMutation.isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Verify'}
            </button>
          )}
          {usernames[platformKey]?.username && (
            <button
              type="button"
              onClick={() => {
                const updatedUsernames = {
                  ...usernames,
                  [platformKey]: { username: '', isVerified: false }
                };
                setUsernames(updatedUsernames);
                saveMutation.mutate(updatedUsernames);
              }}
              className="px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center"
              title="Remove Integration"
            >
              <Trash2 className="w-4 h-4" />
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
        Link your coding profiles to track your Alumnex Score. Save your usernames below to automatically fetch your stats.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderPlatformInput('github', <PlatformIcon platform="github" className="w-4 h-4 mr-2" />, 'GitHub', 'e.g. octocat')}
          {renderPlatformInput('leetcode', <PlatformIcon platform="leetcode" className="w-4 h-4 mr-2" />, 'LeetCode', 'e.g. alex123')}
          {renderPlatformInput('hackerrank', <PlatformIcon platform="hackerrank" className="w-4 h-4 mr-2" />, 'HackerRank', 'e.g. john_doe')}
          {renderPlatformInput('gfg', <PlatformIcon platform="gfg" className="w-4 h-4 mr-2" />, 'GeeksforGeeks', 'e.g. coder_gfg')}
          {renderPlatformInput('codechef', <PlatformIcon platform="codechef" className="w-4 h-4 mr-2" />, 'CodeChef', 'e.g. coder_chef')}
          {renderPlatformInput('codeforces', <PlatformIcon platform="codeforces" className="w-4 h-4 mr-2" />, 'Codeforces', 'e.g. coder_forces')}
          {renderPlatformInput('duolingo', <PlatformIcon platform="duolingo" className="w-4 h-4 mr-2" />, 'Duolingo', 'e.g. duo_learner')}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" /> Save usernames to fetch stats.
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
