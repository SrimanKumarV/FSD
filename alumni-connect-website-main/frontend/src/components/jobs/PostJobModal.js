import React, { useState } from 'react';
import { api } from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const PostJobModal = ({ onClose, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    company: initialData?.company || '',
    location: initialData?.location || '',
    jobType: initialData?.jobType || 'full-time',
    category: initialData?.category || 'technology',
    isRemote: initialData?.isRemote || false,
    requirements: initialData?.requirements?.length ? initialData.requirements : [''],
    skills: initialData?.skills?.length ? initialData.skills : [''],
    experience: initialData?.experience || 'entry',
    applicationLink: initialData?.applicationLink || '',
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
      if (initialData && initialData._id) {
        await api.put(`/jobs/${initialData._id}`, payload);
        toast.success('Job updated successfully!');
      } else {
        await api.post('/jobs', payload);
        toast.success('Job posted successfully!');
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to post job');
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
    <Modal isOpen={true} onClose={onClose} title={initialData ? "Edit Job or Referral" : "Post a Job or Referral"} className="!p-8">
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
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Location</label>
            <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.location} onChange={e => setFormData(prev => ({...prev, location: e.target.value}))} />
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

          <div>
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={formData.isRemote} onChange={e => setFormData(prev => ({...prev, isRemote: e.target.checked}))} className="rounded text-primary-600 focus:ring-primary-500" />
              <span>Is Remote?</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea required rows="4" maxLength={500} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.description} onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}></textarea>
            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.description.length} / 500
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Application Link</label>
            <input required type="url" placeholder="https://" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 text-black dark:text-white" value={formData.applicationLink} onChange={e => setFormData(prev => ({...prev, applicationLink: e.target.value}))} />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Skills</label>
            {formData.skills.map((skill, index) => (
              <input key={index} type="text" placeholder="Skill" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2 text-black dark:text-white" value={skill} onChange={(e) => handleArrayChange('skills', index, e.target.value)} />
            ))}
            <button type="button" onClick={() => addArrayItem('skills')} className="text-sm text-primary-600 hover:text-primary-700 font-semibold">+ Add Skill</button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Requirements</label>
            {formData.requirements.map((req, index) => (
              <input key={index} type="text" placeholder="Requirement" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2 text-black dark:text-white" value={req} onChange={(e) => handleArrayChange('requirements', index, e.target.value)} />
            ))}
            <button type="button" onClick={() => addArrayItem('requirements')} className="text-sm text-primary-600 hover:text-primary-700 font-semibold">+ Add Requirement</button>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="button" onClick={onClose} className="px-6 py-2 mr-4 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 font-semibold">Cancel</button>
            <Button variant="primary" type="submit" disabled={loading} className="px-6 py-2">
              {loading ? (initialData ? 'Updating...' : 'Posting...') : (initialData ? 'Update Job' : 'Post Job')}
            </Button>
          </div>
        </form>
    </Modal>
  );
};

export default PostJobModal;
