import React from 'react';
import { Users, Code, BookOpen } from 'lucide-react';

const ProjectCollaboration = () => {
  const projects = [
    {
      id: 1,
      title: 'Smart Health App',
      description: 'A mobile app to track daily health metrics using React Native and Node.js.',
      techStack: ['React Native', 'Node.js', 'MongoDB'],
      seeking: ['Mentorship', 'Team Members'],
      owner: 'Alice Smith'
    },
    {
      id: 2,
      title: 'AI Resume Analyzer',
      description: 'Platform to analyze resumes and give ATS scores using Python and NLP.',
      techStack: ['Python', 'FastAPI', 'React'],
      seeking: ['Mentorship'],
      owner: 'Bob Johnson'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Collaboration</h1>
          <p className="text-gray-600 mt-2">Find team members or seek mentorship from alumni for your projects.</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-primary-700">
          Upload Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h2>
              <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.map(tech => (
                  <span key={tech} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full flex items-center">
                    <Code className="w-3 h-3 mr-1" /> {tech}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {project.seeking.map(item => (
                  <span key={item} className={`text-xs px-2 py-1 rounded-full flex items-center ${
                    item === 'Mentorship' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item === 'Mentorship' ? <BookOpen className="w-3 h-3 mr-1"/> : <Users className="w-3 h-3 mr-1"/>}
                    Seeking {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center">
              <span className="text-sm text-gray-500">By {project.owner}</span>
              <button className="text-primary-600 font-medium text-sm hover:text-primary-700">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectCollaboration;
