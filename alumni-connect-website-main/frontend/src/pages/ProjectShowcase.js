import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderGit2, Plus, Search, ExternalLink, Github, Heart, 
  Eye, Tag, Calendar, User, X, Image as ImageIcon, Edit2, Trash2,
  Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const ProjectShowcase = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formModalState, setFormModalState] = useState({ isOpen: false, mode: 'add', project: null });
  const [selectedProject, setSelectedProject] = useState(null);
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
        setFormModalState({ isOpen: false, mode: 'add', project: null });
        toast.success('Project added successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to add project');
      }
    }
  );

  // Edit project mutation
  const editProjectMutation = useMutation(
    ({ id, data }) => api.put(`/projects/${id}`, data),
    {
      onSuccess: (updatedProject) => {
        queryClient.invalidateQueries(['projects']);
        setFormModalState({ isOpen: false, mode: 'add', project: null });
        // Update selected project if it's currently open
        if (selectedProject && selectedProject._id === updatedProject.data._id) {
          setSelectedProject(updatedProject.data);
        }
        toast.success('Project updated successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update project');
      }
    }
  );

  // Delete project mutation
  const deleteProjectMutation = useMutation(
    (id) => api.delete(`/projects/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['projects']);
        setSelectedProject(null);
        toast.success('Project deleted successfully!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete project');
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

  const handleEdit = (project) => {
    setFormModalState({ isOpen: true, mode: 'edit', project });
    setSelectedProject(null); // Close details modal when opening edit modal
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      deleteProjectMutation.mutate(id);
    }
  };

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
                onClick={() => setFormModalState({ isOpen: true, mode: 'add', project: null })}
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
                onLike={(e) => { e.stopPropagation(); likeProjectMutation.mutate(project._id); }}
                onClick={() => setSelectedProject(project)}
                currentUser={user}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {formModalState.isOpen && (
          <ProjectFormModal 
            mode={formModalState.mode}
            project={formModalState.project}
            onClose={() => setFormModalState({ isOpen: false, mode: 'add', project: null })}
            onSubmit={(data) => {
              if (formModalState.mode === 'add') {
                addProjectMutation.mutate(data);
              } else {
                editProjectMutation.mutate({ id: formModalState.project._id, data });
              }
            }}
            isLoading={addProjectMutation.isLoading || editProjectMutation.isLoading}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProject && (
          <ProjectDetailsModal
            project={selectedProject}
            currentUser={user}
            onClose={() => setSelectedProject(null)}
            onLike={() => likeProjectMutation.mutate(selectedProject._id)}
            onEdit={() => handleEdit(selectedProject)}
            onDelete={() => handleDelete(selectedProject._id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ProjectCard = ({ project, onLike, onClick, currentUser }) => {
  const isLiked = currentUser && project.likes?.includes(currentUser.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="glass-card rounded-2xl overflow-hidden group flex flex-col h-full relative cursor-pointer"
    >
      {/* Thumbnail or Gradient Background */}
      {project.thumbnail && project.thumbnail !== 'no-photo.jpg' ? (
        <div className="h-48 w-full overflow-hidden relative">
          <img 
            src={project.thumbnail} 
            alt={project.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
      ) : (
        <div className="h-48 w-full bg-gradient-to-br from-primary-500/20 to-primary-700/20 relative overflow-hidden flex items-center justify-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <FolderGit2 className="w-16 h-16 text-primary-500/50" />
        </div>
      )}
      
      <div className="p-6 flex-1 flex flex-col relative z-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1" title={project.title}>
            {project.title}
          </h3>
          <div className="flex space-x-2 flex-shrink-0 ml-2">
            {project.githubLink && (
              <a href={project.githubLink} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:text-primary-600 transition-colors">
                <Github className="w-4 h-4" />
              </a>
            )}
            {project.liveLink && (
              <a href={project.liveLink} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:text-primary-600 transition-colors">
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

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700/50 mt-auto">
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

          {/* Removed likes and views for a cleaner layout */}
        </div>
      </div>
    </motion.div>
  );
};

const ProjectDetailsModal = ({ project, currentUser, onClose, onLike, onEdit, onDelete }) => {
  const isLiked = currentUser && project.likes?.includes(currentUser.id);
  const isOwner = currentUser && (project.user?._id === (currentUser._id || currentUser.id) || project.user === (currentUser._id || currentUser.id));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-8 relative flex flex-col max-h-[90vh]"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="overflow-y-auto flex-1">
          {/* Header Image */}
          {project.thumbnail && project.thumbnail !== 'no-photo.jpg' ? (
            <div className="w-full h-64 sm:h-80 relative">
              <img src={project.thumbnail} alt={project.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">{project.title}</h2>
                <div className="flex items-center space-x-3">
                  {project.user?.avatar ? (
                    <img src={project.user.avatar} alt={project.user.name} className="w-8 h-8 rounded-full border-2 border-white/50 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary-500 border-2 border-white/50 flex items-center justify-center text-sm font-medium text-white">
                      {project.user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-white/90 font-medium">{project.user?.name}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-primary-600 to-primary-900 relative flex items-end p-6">
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">{project.title}</h2>
                <div className="flex items-center space-x-3">
                  {project.user?.avatar ? (
                    <img src={project.user.avatar} alt={project.user.name} className="w-8 h-8 rounded-full border-2 border-white/50 object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-sm font-medium text-white">
                      {project.user?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-white/90 font-medium">{project.user?.name}</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 flex-1">
                {project.tags?.map((tag, i) => (
                  <span key={i} className="px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-xl border border-primary-100 dark:border-primary-800">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {project.githubLink && (
                  <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors">
                    <Github className="w-4 h-4 mr-2" />
                    Source
                  </a>
                )}
                {project.liveLink && (
                  <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-md shadow-primary-500/20">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Live Demo
                  </a>
                )}
              </div>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
              {project.description}
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end space-x-3 shrink-0">
            <button
              onClick={onEdit}
              className="flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Project
            </button>
            <button
              onClick={onDelete}
              className="flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Project
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const ProjectFormModal = ({ mode, project, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    githubLink: project?.githubLink || '',
    liveLink: project?.liveLink || '',
    tagsInput: project?.tags?.join(', ') || ''
  });
  
  const [thumbnail, setThumbnail] = useState(project?.thumbnail || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const tags = formData.tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length === 0) {
      toast.error('Please add at least one tag');
      return;
    }
    onSubmit({ ...formData, tags, thumbnail });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const response = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setThumbnail(response.data.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {mode === 'add' ? 'Add New Project' : 'Edit Project'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form id="project-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Image Upload Area */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Project Cover Image</label>
              <div 
                className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden relative transition-colors ${thumbnail ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                    <span className="text-sm text-gray-500">Uploading...</span>
                  </div>
                ) : thumbnail && thumbnail !== 'no-photo.jpg' ? (
                  <>
                    <img src={thumbnail} alt="Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Upload className="w-8 h-8 text-white mb-2" />
                      <span className="text-white font-medium">Change Image</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                    <span className="text-sm font-medium">Click to upload cover image</span>
                    <span className="text-xs mt-1 opacity-75">PNG, JPG, WEBP up to 5MB</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Project Title <span className="text-red-500">*</span></label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow"
                placeholder="e.g. Alumnex Connect"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={6}
                maxLength={100000}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none transition-shadow"
                placeholder="Describe your project in detail, features, challenges faced, and what you learned..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tech Stack / Tags <span className="text-red-500">*</span></label>
              <input
                required
                type="text"
                value={formData.tagsInput}
                onChange={(e) => setFormData({...formData, tagsInput: e.target.value})}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow"
                placeholder="React, Node.js, MongoDB, Tailwind CSS (Comma separated)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">GitHub Link</label>
                <input
                  type="url"
                  value={formData.githubLink}
                  onChange={(e) => setFormData({...formData, githubLink: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow"
                  placeholder="https://github.com/username/repo"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Live Demo Link</label>
                <input
                  type="url"
                  value={formData.liveLink}
                  onChange={(e) => setFormData({...formData, liveLink: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow"
                  placeholder="https://my-project.vercel.app"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 sm:px-6 sm:py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end space-x-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            form="project-form"
            type="submit"
            disabled={isLoading || isUploading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center shadow-md shadow-primary-500/20"
          >
            {isLoading ? (mode === 'add' ? 'Publishing...' : 'Saving...') : (mode === 'add' ? 'Publish Project' : 'Save Changes')}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectShowcase;
