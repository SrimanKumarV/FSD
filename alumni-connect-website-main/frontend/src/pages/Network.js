import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus, UserCheck, MessageSquare, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from '../components/DefaultAvatar';

const Network = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch users
  const { data, isLoading } = useQuery(
    ['network-users', debouncedSearch],
    () => api.get(`/users/search?q=${debouncedSearch}`),
    {
      keepPreviousData: true
    }
  );

  // Fetch current user's connections/followers
  const { data: connectionsData } = useQuery(
    ['user-connections', currentUser?._id],
    () => api.get(`/users/${currentUser?._id}/connections`),
    { enabled: !!currentUser?._id }
  );

  const followingIds = connectionsData?.data?.following?.map(f => f._id) || [];

  // Follow mutation
  const followMutation = useMutation(
    (userId) => api.post(`/users/${userId}/follow`),
    {
      onSuccess: () => {
        toast.success('Request sent successfully');
        queryClient.invalidateQueries(['user-connections', currentUser?._id]);
        queryClient.invalidateQueries(['network-users']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to follow user');
      }
    }
  );

  // Unfollow mutation
  const unfollowMutation = useMutation(
    (userId) => api.post(`/users/${userId}/unfollow`),
    {
      onSuccess: () => {
        toast.success('Unfollowed successfully');
        queryClient.invalidateQueries(['user-connections', currentUser?._id]);
        queryClient.invalidateQueries(['network-users']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to unfollow user');
      }
    }
  );

  const handleFollowToggle = (userId, isFollowing, isRequested) => {
    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else if (isRequested) {
      toast('Follow request already sent', { icon: 'ℹ️' });
    } else {
      followMutation.mutate(userId);
    }
  };

  const pendingRequests = connectionsData?.data?.followRequests || [];

  const acceptMutation = useMutation(
    (userId) => api.post(`/users/${userId}/accept-follow`),
    {
      onSuccess: () => {
        toast.success('Request accepted');
        queryClient.invalidateQueries(['user-connections', currentUser?._id]);
        queryClient.invalidateQueries(['network-users']);
      }
    }
  );

  const declineMutation = useMutation(
    (userId) => api.post(`/users/${userId}/decline-follow`),
    {
      onSuccess: () => {
        toast.success('Request declined');
        queryClient.invalidateQueries(['user-connections', currentUser?._id]);
        queryClient.invalidateQueries(['network-users']);
      }
    }
  );

  const handleMessage = (userEmail) => {
    navigate('/chat', { state: { startChatWith: userEmail } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Network</h1>
          <p className="text-gray-600 dark:text-gray-400">Discover and connect with fellow alumni and students</p>
        </div>
      </div>

      <div className="glass-card p-6 mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, skills, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pending Follow Requests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.map(reqUser => (
              <div key={reqUser._id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {reqUser.photo && reqUser.photo !== 'default-avatar.png' ? (
                    <img src={reqUser.photo} alt={reqUser.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <DefaultAvatar className="w-10 h-10 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{reqUser.name}</h4>
                    <p className="text-xs text-gray-500 capitalize">{reqUser.role}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => acceptMutation.mutate(reqUser._id)} disabled={acceptMutation.isLoading} className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-all disabled:opacity-50">Accept</button>
                  <button onClick={() => declineMutation.mutate(reqUser._id)} disabled={declineMutation.isLoading} className="px-3 py-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all disabled:opacity-50">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data?.users?.map((user) => {
            const isFollowing = followingIds.includes(user._id);
            const isRequested = user.followRequests?.some(id => id.toString() === (currentUser?._id || currentUser?.id)?.toString());
            return (
              <motion.div
                key={user._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 flex flex-col"
              >
                <div className="flex items-start space-x-4 mb-4">
                  {user.photo && user.photo !== 'default-avatar.png' ? (
                    <img src={user.photo} alt={user.name} className="w-16 h-16 rounded-full object-cover shadow-soft flex-shrink-0" />
                  ) : (
                    <DefaultAvatar className="w-16 h-16 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {user.name}
                    </h3>
                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400 capitalize mb-1">
                      {user.role}
                    </p>
                    {user.location && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">{user.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4 flex-1">
                  {user.role === 'alumni' && user.alumniInfo && (
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      {user.alumniInfo.company && (
                        <div className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate">{user.alumniInfo.position} at {user.alumniInfo.company}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {user.role === 'student' && user.studentInfo && (
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      {user.studentInfo.course && (
                        <div className="flex items-center">
                          <GraduationCap className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate">{user.studentInfo.course}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {user.skills && user.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {user.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg">
                          {skill}
                        </span>
                      ))}
                      {user.skills.length > 3 && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg">
                          +{user.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleFollowToggle(user._id, isFollowing, isRequested)}
                    disabled={followMutation.isLoading || unfollowMutation.isLoading}
                    className={`flex-1 flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                        : isRequested
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400'
                        : 'bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40'
                    }`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Following
                      </>
                    ) : isRequested ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Requested
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleMessage(user.email)}
                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                    title="Message"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
          {(!data?.data?.users || data.data.users.length === 0) && (
            <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
              No members found matching your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Network;
