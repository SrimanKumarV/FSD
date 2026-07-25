import React, { useState, useEffect } from 'react';
import { Users, Code, BookOpen, Search } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ProjectCollaboration = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [search]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/projects?search=${search}`);
      setProjects(res.data.projects || []);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Collaboration</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Find team members or seek mentorship from alumni for your projects.</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-primary-700 transition-colors whitespace-nowrap">
          Upload Project
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-1 md:col-span-2 text-center py-12 text-gray-500 dark:text-gray-400">No projects found.</div>
          ) : (
            projects.map(project => (
              <div key={project._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition flex flex-col">
                <div className="p-6 flex-grow">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{project.title}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags && project.tags.map(tech => (
                      <span key={tech} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full flex items-center">
                        <Code className="w-3 h-3 mr-1" /> {tech}
                      </span>
                    ))}
                  </div>

                  {/* Note: The backend model might not have "seeking" array explicitly, but we can simulate or show live link/github */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.githubLink && (
                      <a href={project.githubLink} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded-full flex items-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                        <Code className="w-3 h-3 mr-1"/> GitHub
                      </a>
                    )}
                    {project.liveLink && (
                      <a href={project.liveLink} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded-full flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50">
                        <BookOpen className="w-3 h-3 mr-1"/> Live Demo
                      </a>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center mt-auto">
                  <div className="flex items-center space-x-2">
                    {project.user?.avatar ? (
                      <img src={project.user.avatar} alt={project.user.name} className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs text-primary-700 dark:text-primary-300">
                        {project.user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">{project.user?.name || 'Unknown User'}</span>
                  </div>
                  <button className="text-primary-600 dark:text-primary-400 font-medium text-sm hover:text-primary-700 dark:hover:text-primary-300">
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectCollaboration;
