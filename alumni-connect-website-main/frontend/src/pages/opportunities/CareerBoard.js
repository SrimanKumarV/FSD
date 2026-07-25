import React, { useState } from 'react';
import { Briefcase, MapPin, Building, Clock } from 'lucide-react';

const CareerBoard = () => {
  const [activeTab, setActiveTab] = useState('jobs');
  
  // Mock data for display
  const jobs = [
    { id: 1, title: 'Frontend Developer Intern', company: 'Google', location: 'Remote', type: 'Internship', posted: '2 days ago' },
    { id: 2, title: 'SDE-1', company: 'Amazon', location: 'Bangalore', type: 'Job', posted: '1 week ago' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Career Opportunities</h1>
          <p className="text-gray-600 mt-2">Find internships, jobs, referrals, and walk-in drives posted by alumni.</p>
        </div>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-primary-700">
          Post Opportunity
        </button>
      </div>

      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        {['jobs', 'internships', 'referrals', 'hackathons'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 font-medium capitalize ${
              activeTab === tab 
                ? 'border-b-2 border-primary-600 text-primary-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-6">
        {jobs.map(job => (
          <div key={job.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center"><Building className="w-4 h-4 mr-1"/> {job.company}</span>
                    <span className="flex items-center"><MapPin className="w-4 h-4 mr-1"/> {job.location}</span>
                    <span className="flex items-center"><Briefcase className="w-4 h-4 mr-1"/> {job.type}</span>
                    <span className="flex items-center"><Clock className="w-4 h-4 mr-1"/> {job.posted}</span>
                  </div>
                </div>
              </div>
              <button className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50">
                Apply Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareerBoard;
