import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatExternalUrl } from '../utils/api';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar,
  Edit3,
  Save,
  X,
  Camera,
  Linkedin,
  Github,
  Globe,
  Twitter,
  ExternalLink,
  RefreshCw,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser, fetchLinkedInData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    skills: [],
    socialLinks: {
      linkedin: '',
      github: '',
      twitter: '',
      website: ''
    }
  });
  const [roleFormData, setRoleFormData] = useState({
    alumniInfo: {},
    studentInfo: {}
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkedinUrlInput, setLinkedinUrlInput] = useState('');
  const [isSyncingLinkedIn, setIsSyncingLinkedIn] = useState(false);

  useEffect(() => {
    if (user) {
      setLinkedinUrlInput(user.socialLinks?.linkedin || user.linkedinData?.profileUrl || '');
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        skills: user.skills || [],
        socialLinks: {
          linkedin: user.socialLinks?.linkedin || '',
          github: user.socialLinks?.github || '',
          twitter: user.socialLinks?.twitter || '',
          website: user.socialLinks?.website || ''
        }
      });

      setRoleFormData({
        alumniInfo: user.alumniInfo || {},
        studentInfo: user.studentInfo || {}
      });
    }
  }, [user]);

  const handleLinkedInSync = async (e) => {
    if (e) e.preventDefault();
    if (!linkedinUrlInput.trim()) return;
    setIsSyncingLinkedIn(true);
    try {
      await fetchLinkedInData(linkedinUrlInput.trim());
    } catch (error) {
      console.error('LinkedIn sync error:', error);
    } finally {
      setIsSyncingLinkedIn(false);
    }
  };

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

  const handleRoleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setRoleFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
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

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const role = user.role;
      await updateUser(roleFormData, role);
      setIsEditingRole(false);
    } catch (error) {
      console.error('Error updating role profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'busy': return 'text-red-600 bg-red-100';
      case 'away': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
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
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {user.photo ? (
                  <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full hover:bg-primary-dark transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">{user.name}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                  {user.status || 'offline'}
                </span>
              </div>
              
              <div className="flex items-center space-x-6 text-gray-600">
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
                <p className="text-gray-700 mt-4 leading-relaxed">{user.bio}</p>
              )}

              {/* Social / Developer Links Display */}
              {user.socialLinks && (
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  {user.socialLinks.linkedin && (
                    <a
                      href={formatExternalUrl(user.socialLinks.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> LinkedIn <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                    </a>
                  )}
                  {user.socialLinks.github && (
                    <a
                      href={formatExternalUrl(user.socialLinks.github)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                    >
                      <Github className="w-3.5 h-3.5 mr-1.5 text-gray-800" /> GitHub <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                    </a>
                  )}
                  {user.socialLinks.twitter && (
                    <a
                      href={formatExternalUrl(user.socialLinks.twitter)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 transition-colors"
                    >
                      <Twitter className="w-3.5 h-3.5 mr-1.5 text-sky-500" /> Twitter <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                    </a>
                  )}
                  {user.socialLinks.website && (
                    <a
                      href={formatExternalUrl(user.socialLinks.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Website <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* LinkedIn Profile Integration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-xl shadow-md p-6 mb-8 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-4 border-b border-blue-800/80 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow">
                <Linkedin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  LinkedIn Integration
                  {user.linkedinData && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Synced
                    </span>
                  )}
                </h3>
                <p className="text-xs text-blue-200">
                  Fetch professional headline, experience, and background from LinkedIn
                </p>
              </div>
            </div>
          </div>

          {user.linkedinData ? (
            <div className="bg-blue-950/60 backdrop-blur border border-blue-700/50 rounded-lg p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={user.linkedinData.avatarUrl || user.photo}
                    alt="LinkedIn Avatar"
                    className="w-14 h-14 rounded-full border-2 border-blue-400 object-cover"
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-white">{user.linkedinData.headline}</h4>
                    <p className="text-sm text-blue-200 mt-0.5">
                      {user.linkedinData.position} at <span className="text-white font-medium">{user.linkedinData.company}</span>
                    </p>
                    {user.linkedinData.summary && (
                      <p className="text-xs text-gray-300 mt-2 line-clamp-2 max-w-2xl leading-relaxed">
                        "{user.linkedinData.summary}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {user.linkedinData.profileUrl && (
                    <a
                      href={formatExternalUrl(user.linkedinData.profileUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" /> View Profile
                    </a>
                  )}
                  <button
                    onClick={handleLinkedInSync}
                    disabled={isSyncingLinkedIn}
                    className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg border border-white/20 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isSyncingLinkedIn ? 'animate-spin' : ''}`} />
                    {isSyncingLinkedIn ? 'Syncing...' : 'Re-sync Data'}
                  </button>
                </div>
              </div>
              {user.linkedinData.syncedAt && (
                <p className="text-[11px] text-blue-300/70 mt-3 text-right">
                  Last synced: {new Date(user.linkedinData.syncedAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={handleLinkedInSync} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Linkedin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={linkedinUrlInput}
                  onChange={(e) => setLinkedinUrlInput(e.target.value)}
                  placeholder="Paste your LinkedIn profile URL or username (e.g. linkedin.com/in/username)"
                  className="w-full pl-10 pr-4 py-2.5 bg-blue-950/70 border border-blue-700/60 rounded-lg text-white placeholder-blue-300/60 focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={isSyncingLinkedIn || !linkedinUrlInput.trim()}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 shadow"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isSyncingLinkedIn ? 'Fetching...' : 'Fetch LinkedIn Data'}
              </button>
            </form>
          )}
        </motion.div>

        {/* Profile Form */}
        {isEditing && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-lg shadow-sm p-6 mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills
                </label>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
              <h4 className="text-lg font-medium text-gray-900 mb-4">Social Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Linkedin className="w-4 h-4 inline mr-2" />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="socialLinks.linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Github className="w-4 h-4 inline mr-2" />
                    GitHub
                  </label>
                  <input
                    type="url"
                    name="socialLinks.github"
                    value={formData.socialLinks.github}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://github.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Twitter className="w-4 h-4 inline mr-2" />
                    Twitter
                  </label>
                  <input
                    type="url"
                    name="socialLinks.twitter"
                    value={formData.socialLinks.twitter}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://twitter.com/username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-2" />
                    Website
                  </label>
                  <input
                    type="url"
                    name="socialLinks.website"
                    value={formData.socialLinks.website}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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

        {/* Role-Specific Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {user.role === 'alumni' ? 'Professional Information' : 'Academic Information'}
            </h3>
            <button
              onClick={() => setIsEditingRole(!isEditingRole)}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              {isEditingRole ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
              {isEditingRole ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {user.role === 'alumni' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <GraduationCap className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Graduation Year</p>
                  <p className="font-medium">{user.alumniInfo?.graduationYear || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Briefcase className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{user.alumniInfo?.company || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Briefcase className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium">{user.alumniInfo?.position || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Briefcase className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="font-medium">{user.alumniInfo?.industry || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Experience</p>
                  <p className="font-medium">{user.alumniInfo?.experience || 'Not specified'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <GraduationCap className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Course</p>
                  <p className="font-medium">{user.studentInfo?.course || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="font-medium">{user.studentInfo?.year || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Expected Graduation</p>
                  <p className="font-medium">{user.studentInfo?.expectedGraduation || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}

          {isEditingRole && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleRoleSubmit}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Update {user.role === 'alumni' ? 'Professional' : 'Academic'} Information
              </h4>
              
              {user.role === 'alumni' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      name="alumniInfo.graduationYear"
                      value={roleFormData.alumniInfo?.graduationYear || ''}
                      onChange={handleRoleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="1950"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      name="alumniInfo.company"
                      value={roleFormData.alumniInfo?.company || ''}
                      onChange={handleRoleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      name="alumniInfo.position"
                      value={roleFormData.alumniInfo?.position || ''}
                      onChange={handleRoleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Industry
                    </label>
                    <input
                      type="text"
                      name="alumniInfo.industry"
                      value={roleFormData.alumniInfo?.industry || ''}
                      onChange={handleRoleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience (years)
                    </label>
                    <input
                      type="number"
                      name="alumniInfo.experience"
                      value={roleFormData.alumniInfo?.experience || ''}
                      onChange={handleRoleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course
                    </label>
                    <input
                      type="text"
                      name="studentInfo.course"
                      value={roleFormData.studentInfo?.course || ''}
                      onChange={handleRoleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      name="studentInfo.year"
                      value={roleFormData.studentInfo?.year || ''}
                      onChange={handleRoleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min="1"
                      max="6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Graduation
                    </label>
                    <input
                      type="number"
                      name="studentInfo.expectedGraduation"
                      value={roleFormData.studentInfo?.expectedGraduation || ''}
                      onChange={handleRoleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      min={new Date().getFullYear()}
                      max={new Date().getFullYear() + 10}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditingRole(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
        </motion.div>

        {/* Account Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Status</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                user.isVerified ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <p className="text-sm text-gray-500">Verification</p>
              <p className="font-medium">
                {user.isVerified ? 'Verified' : 'Pending'}
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                user.isApproved ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <p className="text-sm text-gray-500">Approval</p>
              <p className="font-medium">
                {user.isApproved ? 'Approved' : 'Pending'}
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                user.isActive ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">
                {user.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
            {user.lastActive && (
              <p className="text-sm text-gray-500 mt-1">
                Last active {new Date(user.lastActive).toLocaleDateString()}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
