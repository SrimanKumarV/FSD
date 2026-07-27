import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Search, UserCheck, Clock, Users, X, Check, Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import UserAvatar from '../../components/UserAvatar';

const MentorAllocation = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState('');

  useEffect(() => {
    if (user?.role === 'student') {
      fetchMentors();
    } else if (user?.role === 'alumni') {
      fetchRequests();
    }
  }, [user, domainFilter]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/mentorship/mentors?industry=${domainFilter}`);
      setMentors(res.data?.mentors || res.data || []);
    } catch (error) {
      toast.error('Failed to fetch mentors');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // For alumni, fetch requests sent to them
      const res = await api.get('/mentorship?type=active');
      setRequests(res.data.mentorships || []);
    } catch (error) {
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const requestMentor = async (mentorId) => {
    try {
      await api.post('/mentorship/request', {
        mentorId,
        domain: 'General Guidance',
        message: 'I would like you to be my mentor.'
      });
      toast.success('Mentorship requested successfully');
      fetchMentors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request mentorship');
    }
  };

  const acceptRequest = async (requestId) => {
    try {
      await api.put(`/mentorship/accept/${requestId}`);
      toast.success('Request accepted');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept');
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      await api.put(`/mentorship/reject/${requestId}`, {
        rejectionReason: 'Currently at full capacity'
      });
      toast.success('Request rejected');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Smart Mentor Allocation</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Automated matching based on domain expertise and availability.</p>
      </div>

      {user?.role === 'student' && (
        <>
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by domain (e.g. Software Engineering)"
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mentors.map((mentor) => {
              const remaining = mentor.remainingCapacity ?? 10;
              const total = mentor.totalSeats ?? 10;
              const pct = Math.max(0, (remaining / total) * 100);
              const barColor = remaining === 0 ? 'bg-red-500' : remaining <= 3 ? 'bg-yellow-500' : 'bg-green-500';
              const badgeColor = remaining === 0
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : remaining <= 3
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';

              return (
                <div key={mentor._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                  <div className="flex items-center space-x-4 mb-4">
                    <UserAvatar src={mentor.photo} name={mentor.name} className="w-14 h-14" />
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{mentor.name}</h3>
                      <p className="text-sm text-primary-600 dark:text-primary-400">{mentor.alumniInfo?.position}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{mentor.alumniInfo?.company}</p>
                    </div>
                  </div>

                  {/* Reward points badge if available */}
                  {mentor.rewardPoints !== undefined && (
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-3.5 h-3.5 text-yellow-500" />
                      <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">{mentor.rewardPoints} reward pts</span>
                    </div>
                  )}

                  {/* Live seat availability bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Seats
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {remaining} / {total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {mentor.alumniInfo?.mentorshipAreas?.map((area, idx) => (
                      <span key={idx} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded">
                        {area}
                      </span>
                    ))}
                    {mentor.skills?.slice(0, 3).map((skill, idx) => (
                      <span key={`s-${idx}`} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => requestMentor(mentor._id)}
                    disabled={remaining <= 0}
                    className={`mt-auto w-full py-2 rounded-lg font-medium transition-colors ${
                      remaining > 0
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {remaining > 0 ? 'Request Mentor' : 'No Seats Available'}
                  </button>
                </div>
              );
            })}
            {mentors.length === 0 && (
              <div className="col-span-3 text-center py-10 text-gray-500 dark:text-gray-400">
                No mentors available for this domain.
              </div>
            )}
          </div>
        </>
      )}

      {user?.role === 'alumni' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {requests.map((req) => (
                <tr key={req._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <UserAvatar src={req.student?.photo} name={req.student?.name} className="w-9 h-9" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{req.student?.name}</div>
                        {req.isAutoAssigned && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-medium">Auto-Assigned</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{req.domain}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => acceptRequest(req._id)} className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 p-1.5 rounded-lg transition-colors">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => rejectRequest(req._id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg transition-colors">
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                    No active requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MentorAllocation;
