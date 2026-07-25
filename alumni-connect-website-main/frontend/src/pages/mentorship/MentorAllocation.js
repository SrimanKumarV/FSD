import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Search, UserCheck, Clock, Users, X, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
      const res = await api.get(`/mentorship/available-mentors?domain=${domainFilter}`);
      setMentors(res.data);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mentor Allocation</h1>
        <p className="text-gray-600 dark:text-gray-400">Smart mentor allocation based on domain and availability.</p>
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
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <div key={mentor._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-4 mb-4">
                  <img src={mentor.photo || '/default-avatar.png'} alt={mentor.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{mentor.name}</h3>
                    <p className="text-sm text-gray-500">{mentor.alumniInfo?.company}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Users className="w-4 h-4 mr-2" />
                  Capacity: {mentor.remainingCapacity} slots left
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {mentor.alumniInfo?.mentorshipAreas?.map((area, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      {area}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => requestMentor(mentor._id)}
                  disabled={mentor.remainingCapacity <= 0}
                  className={`w-full py-2 rounded-lg font-medium ${
                    mentor.remainingCapacity > 0
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {mentor.remainingCapacity > 0 ? 'Request Mentor' : 'No Seats Available'}
                </button>
              </div>
            ))}
            {mentors.length === 0 && (
              <div className="col-span-3 text-center py-10 text-gray-500">
                No mentors available for this domain.
              </div>
            )}
          </div>
        </>
      )}

      {user?.role === 'alumni' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{req.student?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.domain}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => acceptRequest(req._id)} className="text-green-600 hover:text-green-900">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => rejectRequest(req._id)} className="text-red-600 hover:text-red-900">
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
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
