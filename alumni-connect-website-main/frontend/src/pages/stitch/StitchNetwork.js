import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import UserAvatar from '../../components/UserAvatar';

const StitchNetwork = () => {
  const { user: currentUser } = useAuth();
  const { onlineUsersMap } = useSocket();
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
    ['network-users', debouncedSearch, currentUser?.role],
    () => api.get(`/users/search?q=${debouncedSearch}&role=${currentUser?.role}`),
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
      }
    }
  );

  const handleMessage = (userEmail) => {
    navigate('/chat', { state: { startChatWith: userEmail } });
  };

  return (
    <>
      <div className="mb-6 lg:mb-8">
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">Alumni Network</h2>
        <p className="font-body-base text-body-base text-on-surface-variant mt-2 max-w-2xl">Connect with thousands of graduates. Filter by industry, graduation year, or location to find the right connections for your career journey.</p>
      </div>
      
      {/* Search & Filters Container */}
      <div className="glass-card rounded-xl p-4 lg:p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
            <input 
              className="glass-input w-full pl-10 pr-4 py-3 rounded-lg font-body-base text-body-base text-on-surface placeholder:text-outline-variant" 
              placeholder="Search by name, headline, or keywords..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-body-bold text-body-bold hover:shadow-primary-500/30 shadow-sm transition-all whitespace-nowrap">
            Search
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select className="glass-input rounded-lg px-4 py-2 font-body-sm text-body-sm text-on-surface appearance-none pr-10 cursor-pointer relative" style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23737686%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em" }}>
            <option value="">Graduation Year</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </select>
          <select className="glass-input rounded-lg px-4 py-2 font-body-sm text-body-sm text-on-surface appearance-none pr-10 cursor-pointer" style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23737686%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.5rem center", backgroundSize: "1.5em 1.5em" }}>
            <option value="">Industry</option>
            <option value="tech">Technology</option>
            <option value="finance">Finance</option>
            <option value="health">Healthcare</option>
          </select>
          <button className="flex items-center gap-2 text-primary font-body-sm text-body-sm font-medium px-2 py-2 hover:bg-primary-container/10 rounded-lg transition-colors ml-auto">
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Advanced Filters
          </button>
        </div>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data?.users?.map((user) => {
            const isFollowing = followingIds.includes(user._id);
            const isRequested = user.followRequests?.some(id => id.toString() === (currentUser?._id || currentUser?.id)?.toString());
            
            return (
              <div key={user._id} className="glass-card rounded-xl p-6 flex flex-col hover:-translate-y-1 transition-transform duration-300 cursor-pointer" onClick={() => navigate(`/users/${user._id}`)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    <UserAvatar src={user.photo} name={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-surface" />
                    {onlineUsersMap?.has(user._id) && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-surface rounded-full"></div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {user.role === 'alumni' && (
                      <span className="material-symbols-outlined text-alumni-magenta bg-alumni-magenta/10 rounded-full p-1 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }} title="Verified Alumnus">verified</span>
                    )}
                  </div>
                </div>
                
                <h3 className="font-title-lg text-title-lg text-on-surface mb-1">{user.name}</h3>
                
                <p className="font-body-sm text-body-sm text-primary font-medium mb-3 capitalize">
                  {user.alumniInfo?.position || user.role} {user.alumniInfo?.company ? `@ ${user.alumniInfo.company}` : ''}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {user.college && (
                    <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant font-caption-xs text-caption-xs px-2 py-1 rounded-md">
                      <span className="material-symbols-outlined text-[14px]">school</span> {user.college}
                    </span>
                  )}
                  {user.location && (
                    <span className="inline-flex items-center gap-1 bg-surface-container-high text-on-surface-variant font-caption-xs text-caption-xs px-2 py-1 rounded-md">
                      <span className="material-symbols-outlined text-[14px]">location_on</span> {user.location}
                    </span>
                  )}
                </div>
                
                <p className="font-body-sm text-body-sm text-on-surface-variant mb-6 line-clamp-2">
                  {user.skills?.join(', ')}
                </p>
                
                <div className="mt-auto flex gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); if(!isFollowing && !isRequested) followMutation.mutate(user._id); }}
                    className={`flex-1 font-body-sm text-body-sm font-medium py-2 rounded-lg transition-colors ${
                      isFollowing ? 'bg-surface-container-high text-on-surface' :
                      isRequested ? 'bg-surface-container text-on-surface-variant' :
                      'bg-primary text-on-primary hover:bg-primary/90'
                    }`}
                  >
                    {isFollowing ? 'Following' : isRequested ? 'Requested' : 'Connect'}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleMessage(user.email); }}
                    className="flex-1 border border-outline text-on-surface font-body-sm text-body-sm font-medium py-2 rounded-lg hover:bg-surface-container transition-colors flex justify-center items-center"
                  >
                    Message
                  </button>
                </div>
              </div>
            );
          })}
          
          {(!data?.data?.users || data.data.users.length === 0) && (
            <div className="col-span-full py-12 text-center text-on-surface-variant font-body-base">
              No members found matching your search.
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default StitchNetwork;
