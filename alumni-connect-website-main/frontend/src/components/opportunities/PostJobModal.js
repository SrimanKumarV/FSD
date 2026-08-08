import React, { useState } from 'react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';

const PostJobModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    jobType: 'full-time',
    category: 'technology',
    isRemote: false,
    requirements: [''],
    skills: [''],
    experience: 'entry',
    applicationLink: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        requirements: formData.requirements.filter(r => r.trim() !== ''),
        skills: formData.skills.filter(s => s.trim() !== '')
      };
      await api.post('/jobs', payload);
      toast.success('Job posted successfully!');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors && err.response.data.errors.length > 0) {
        toast.error(err.response.data.errors[0].msg);
      } else {
        toast.error(err.response?.data?.message || 'Failed to post job');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleArrayChange = (field, index, value) => {
    const newArr = [...formData[field]];
    newArr[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArr }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative my-8 custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white text-xl font-bold">&times;</button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Post a Job or Referral</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Job Title</label>
              <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.title} onChange={e => setFormData(prev => ({...prev, title: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Company</label>
              <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.company} onChange={e => setFormData(prev => ({...prev, company: e.target.value}))} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.location} onChange={e => setFormData(prev => ({...prev, location: e.target.value}))} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.category} onChange={e => setFormData(prev => ({...prev, category: e.target.value}))}>
                <option value="technology">Technology</option>
                <option value="business">Business</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="finance">Finance</option>
                <option value="marketing">Marketing</option>
                <option value="design">Design</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Job Type</label>
              <select className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.jobType} onChange={e => setFormData(prev => ({...prev, jobType: e.target.value}))}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
                <option value="freelance">Freelance</option>
                <option value="referral">Referral</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Experience</label>
              <select className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.experience} onChange={e => setFormData(prev => ({...prev, experience: e.target.value}))}>
                <option value="entry">Entry Level</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea required rows="4" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white custom-scrollbar" value={formData.description} onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}></textarea>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Requirements</label>
              <button type="button" onClick={() => addArrayItem('requirements')} className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">+ Add</button>
            </div>
            {formData.requirements.map((req, index) => (
              <input key={index} required={index === 0} type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white mb-2" placeholder="e.g. 3+ years of React experience" value={req} onChange={e => handleArrayChange('requirements', index, e.target.value)} />
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Skills</label>
              <button type="button" onClick={() => addArrayItem('skills')} className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">+ Add</button>
            </div>
            {formData.skills.map((skill, index) => (
              <input key={index} required={index === 0} type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white mb-2" placeholder="e.g. JavaScript, React, Node.js" value={skill} onChange={e => handleArrayChange('skills', index, e.target.value)} />
            ))}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Application Link (Optional)</label>
            <input type="url" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" placeholder="https://..." value={formData.applicationLink} onChange={e => setFormData(prev => ({...prev, applicationLink: e.target.value}))} />
          </div>

          <div className="flex items-center mt-2">
            <input type="checkbox" id="isRemote" className="mr-2" checked={formData.isRemote} onChange={e => setFormData(prev => ({...prev, isRemote: e.target.checked}))} />
            <label htmlFor="isRemote" className="text-sm font-medium text-gray-700 dark:text-gray-300">This is a remote position</label>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="button" onClick={onClose} className="px-6 py-2 mr-4 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 font-semibold">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary-500/30">
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostJobModal;
