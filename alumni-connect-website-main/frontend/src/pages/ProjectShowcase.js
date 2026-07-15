import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderGit2, Plus, Search, ExternalLink, Github, Heart, 
  Eye, Tag, Calendar, User, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const ProjectShowcase = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  
  // Fetch projects
  const { data, isLoading } = useQuery(
    ['projects', search],
    () => api.get(`/projects?search=${search}`).then(res => res.data),
    { keepPreviousData: true }
  );

  const projects = data?.projects || [];

  // Add project mutation
  const addProjectMutation = useMutation(
    (projectData) => api.post('/projects', projectData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projects']);
        setShowAddModal(false);
        toast.success('Project added successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add project');
      }
    }
  );

  // Like project mutation
  const likeProjectMutation = useMutation(
    (projectId) => api.put(`/projects/${projectId}/like`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projects']);
      }
    }
  );

  return (
    <div className="min-h-screen pb-8">
      {/* Sticky Header */}
      <div className="mb-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <FolderGit2 className="w-8 h-8 mr-3 text-primary-600" />
                Student Project Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Discover and showcase amazing projects built by our community</p>
            </div>
            {user && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Project
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search projects by title, description, or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:outline-none shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <FolderGit2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No projects found</h3>
            <p className="text-gray-500">Be the first to showcase your work!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard 
                key={project._id} 
                project={project} 
                onLike={() => likeProjectMutation.mutate(project._id)}
                currentUser={user}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddProjectModal 
            onClose={() => setShowAddModal(false)}
            onSubmit={(data) => addProjectMutation.mutate(data)}
            isLoading={addProjectMutation.isLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ProjectCard = ({ project, onLike, currentUser }) => {
  const isLiked = currentUser && project.likes?.includes(currentUser.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="glass-card rounded-2xl overflow-hidden group flex flex-col h-full relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="p-6 flex-1 flex flex-col relative z-10">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1" title={project.title}>
            {project.title}
          </h3>
          <div className="flex space-x-2 flex-shrink-0 ml-2">
            {project.githubLink && (
              <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:text-primary-600 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            )}
            {project.liveLink && (
              <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:text-primary-600 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 flex-1">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags?.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-2.5 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-lg">
              {tag}
            </span>
          ))}
          {project.tags?.length > 3 && (
            <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-lg">
              +{project.tags.length - 3} more
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <div className="flex items-center space-x-2">
            {project.user?.avatar ? (
              <img src={project.user.avatar} alt={project.user.name} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-medium text-primary-600">
                {project.user?.name?.charAt(0) || 'U'}
              </div>
            )}
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{project.user?.name}</span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span className="flex items-center">
              <Eye className="w-3.5 h-3.5 mr-1" />
              {project.views}
            </span>
            <button 
              onClick={onLike}
              className={`flex items-center transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            >
              <Heart className={`w-3.5 h-3.5 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {project.likes?.length || 0}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AddProjectModal = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    githubLink: '',
    liveLink: '',
    tagsInput: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const tags = formData.tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length === 0) {
      toast.error('Please add at least one tag');
      return;
    }
    onSubmit({ ...formData, tags });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full shadow-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Project</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Project Title</label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Alumnex Connect"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Describe your project, features, and what you learned..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tech Stack / Tags (Comma separated)</label>
            <input
              required
              type="text"
              value={formData.tagsInput}
              onChange={(e) => setFormData({...formData, tagsInput: e.target.value})}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500"
              placeholder="React, Node.js, MongoDB..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">GitHub Link</label>
              <input
                type="url"
                value={formData.githubLink}
                onChange={(e) => setFormData({...formData, githubLink: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500"
                placeholder="https://github.com/username/repo"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Live Demo Link</label>
              <input
                type="url"
                value={formData.liveLink}
                onChange={(e) => setFormData({...formData, liveLink: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500"
                placeholder="https://my-project.vercel.app"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isLoading ? 'Publishing...' : 'Publish Project'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProjectShowcase;
