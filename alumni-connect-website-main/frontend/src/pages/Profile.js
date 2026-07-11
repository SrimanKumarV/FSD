import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Mail, 
  MapPin, 
  Briefcase, 
  Edit3,
  X,
  Camera,
  Linkedin,
  Github,
  Globe,
  Twitter,
  MessageSquare,
  Users,
  FileText
} from 'lucide-react';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import DefaultAvatar from '../components/DefaultAvatar';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    skills: [],
    photo: '',
    socialLinks: {
      linkedin: '',
      github: '',
      twitter: '',
      website: ''
    }
  });

  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [network, setNetwork] = useState({ followers: [], following: [] });
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      setLoading(true);
      const res = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({
        ...prev,
        photo: res.data.url
      }));
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNetwork = async (userId) => {
    try {
      const res = await api.get(`/users/${userId}/connections`);
      setNetwork({ followers: res.data.followers || [], following: res.data.following || [] });
    } catch (error) {
      console.error('Error fetching network:', error);
    }
  };



  // Fetch user's forum posts
  const { data: userPostsData, isLoading: loadingPosts } = useQuery(
    ['user-posts', user?._id],
    () => api.get(`/forum`, { params: { author: user?._id } }),
    { enabled: !!user?._id && activeTab === 'posts' }
  );

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        skills: user.skills || [],
        photo: user.photo || '',
        socialLinks: {
          linkedin: user.socialLinks?.linkedin || '',
          github: user.socialLinks?.github || '',
          twitter: user.socialLinks?.twitter || '',
          website: user.socialLinks?.website || ''
        }
      });


      fetchNetwork(user._id);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };



  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUser(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-red-600 bg-red-100';
      case 'away': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Profile Header */}
          <div className="flex items-start space-x-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                {(isEditing ? formData.photo : user.photo) && (isEditing ? formData.photo : user.photo) !== 'default-avatar.png' ? (
                  <img src={isEditing ? formData.photo : user.photo} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <DefaultAvatar className="w-full h-full" />
                )}
              </div>
              {isEditing && (
                <>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary-dark transition-colors z-10">
                    <Camera className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                  {user.status || 'offline'}
                </span>
              </div>
              
              <div className="flex items-center space-x-6 text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  {user.email}
                </div>
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span className="capitalize">{user.role}</span>
                </div>
                {user.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {user.location}
                  </div>
                )}
              </div>

              {user.bio && (
                <p className="text-gray-700 dark:text-gray-300 mt-4 leading-relaxed">{user.bio}</p>
              )}

              <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="text-center cursor-pointer hover:opacity-80" onClick={() => setActiveTab('network')}>
                  <span className="block text-2xl font-bold text-gray-900 dark:text-white">{network.followers.length}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Followers</span>
                </div>
                <div className="text-center cursor-pointer hover:opacity-80" onClick={() => setActiveTab('network')}>
                  <span className="block text-2xl font-bold text-gray-900 dark:text-white">{network.following.length}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Following</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
          <button
            onClick={() => setActiveTab('about')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${activeTab === 'about' ? 'text-primary' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            About
            {activeTab === 'about' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button
            onClick={() => setActiveTab('network')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${activeTab === 'network' ? 'text-primary' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Network
            {activeTab === 'network' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${activeTab === 'posts' ? 'text-primary' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Posts
            {activeTab === 'posts' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        </div>

        {/* Profile Form */}
        {isEditing && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap font-medium text-sm disabled:opacity-50"
                  >
                    Upload Image
                  </button>
                  {formData.photo && <span className="text-sm text-green-600 dark:text-green-400 font-medium">Image successfully uploaded!</span>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills
                </label>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Add a skill..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary text-white"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-red-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Social Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Linkedin className="w-4 h-4 inline mr-2" />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="socialLinks.linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Github className="w-4 h-4 inline mr-2" />
                    GitHub
                  </label>
                  <input
                    type="url"
                    name="socialLinks.github"
                    value={formData.socialLinks.github}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://github.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Twitter className="w-4 h-4 inline mr-2" />
                    Twitter
                  </label>
                  <input
                    type="url"
                    name="socialLinks.twitter"
                    value={formData.socialLinks.twitter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://twitter.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Website
                  </label>
                  <input
                    type="url"
                    name="socialLinks.website"
                    value={formData.socialLinks.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.form>
        )}

        {/* Network Tab */}
        {!isEditing && activeTab === 'network' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Followers */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Followers ({network.followers.length})
              </h3>
              <div className="space-y-4">
                {network.followers.length === 0 ? (
                  <p className="text-gray-500 italic">No followers yet.</p>
                ) : (
                  network.followers.map(follower => (
                    <div key={follower._id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div
                        className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity flex-1"
                        onClick={() => navigate(`/users/${follower._id}`)}
                      >
                        {follower.photo && follower.photo !== 'default-avatar.png' ? (
                          <img src={follower.photo} alt={follower.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <DefaultAvatar className="w-12 h-12 flex-shrink-0" />
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{follower.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {follower.role === 'student' ? (follower.studentInfo?.course || 'Student') : (follower.alumniInfo?.company || 'Alumni')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/chat', { state: { startChatWith: follower.email } })}
                        className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Following */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Following ({network.following.length})
              </h3>
              <div className="space-y-4">
                {network.following.length === 0 ? (
                  <p className="text-gray-500 italic">Not following anyone yet.</p>
                ) : (
                  network.following.map(followingUser => (
                    <div key={followingUser._id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <div
                        className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity flex-1"
                        onClick={() => navigate(`/users/${followingUser._id}`)}
                      >
                        {followingUser.photo && followingUser.photo !== 'default-avatar.png' ? (
                          <img src={followingUser.photo} alt={followingUser.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <DefaultAvatar className="w-12 h-12 flex-shrink-0" />
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{followingUser.name}</h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {followingUser.role === 'student' ? (followingUser.studentInfo?.course || 'Student') : (followingUser.alumniInfo?.company || 'Alumni')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('/chat', { state: { startChatWith: followingUser.email } })}
                        className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Posts Tab */}
        {!isEditing && activeTab === 'posts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary" />
              My Posts
            </h3>
            
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : userPostsData?.data?.posts?.length > 0 ? (
              <div className="space-y-4">
                {userPostsData.data.posts.map(post => (
                  <div 
                    key={post._id} 
                    onClick={() => navigate('/forum', { state: { openPostId: post._id, openPostCategory: post.category } })}
                    className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-primary transition-colors">{post.title}</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4">{post.content}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>• {post.likes?.length || 0} Likes</span>
                      <span>• {post.comments?.length || 0} Comments</span>
                      <span>• {post.views || 0} Views</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-center py-8">You haven't created any posts yet.</p>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default Profile;
