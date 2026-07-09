import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Github, Code2, Terminal, Code } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const DevProfileSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [usernames, setUsernames] = useState({
    github: '',
    leetcode: '',
    hackerrank: '',
    gfg: ''
  });

  const { data, isLoading } = useQuery(
    ['dev-activity', user?.email],
    () => api.get(`/dev-activity/${user?.email}`),
    {
      enabled: !!user?.email,
      retry: false,
      onSuccess: (res) => {
        if (res.data?.usernames) {
          setUsernames({
            github: res.data.usernames.github || '',
            leetcode: res.data.usernames.leetcode || '',
            hackerrank: res.data.usernames.hackerrank || '',
            gfg: res.data.usernames.gfg || ''
          });
        }
      },
      onError: (err) => {
        // It's normal to 404 if they haven't set it up yet
        if (err.response?.status !== 404) {
          console.error('Error fetching dev profile:', err);
        }
      }
    }
  );

  const saveMutation = useMutation(
    (newSettings) => api.post('/dev-activity/usernames', newSettings),
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

  const handleChange = (e) => {
    setUsernames({
      ...usernames,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(usernames);
  };

  if (isLoading && !data) {
    return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-64 rounded-xl"></div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">DevPulse Integrations</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Link your coding profiles to track your consistency and display stats on your DevPulse dashboard. You only need to enter your username (not the full URL).
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* GitHub */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <Github className="w-4 h-4 mr-2" /> GitHub Username
            </label>
            <input
              type="text"
              name="github"
              value={usernames.github}
              onChange={handleChange}
              placeholder="e.g. octocat"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* LeetCode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <Code2 className="w-4 h-4 mr-2" /> LeetCode Username
            </label>
            <input
              type="text"
              name="leetcode"
              value={usernames.leetcode}
              onChange={handleChange}
              placeholder="e.g. alex123"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* HackerRank */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <Terminal className="w-4 h-4 mr-2" /> HackerRank Username
            </label>
            <input
              type="text"
              name="hackerrank"
              value={usernames.hackerrank}
              onChange={handleChange}
              placeholder="e.g. john_doe"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* GeeksForGeeks */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <Code className="w-4 h-4 mr-2" /> GeeksforGeeks Handle
            </label>
            <input
              type="text"
              name="gfg"
              value={usernames.gfg}
              onChange={handleChange}
              placeholder="e.g. coder_gfg"
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saveMutation.isLoading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saveMutation.isLoading ? 'Saving...' : 'Save Connections'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DevProfileSettings;
