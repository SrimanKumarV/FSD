import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { TrendingUp, Users, Award, BookOpen, Target, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('6M');

  // Mock data based on role
  const isAlumni = user?.role === 'alumni';

  const monthlyData = [
    { name: 'Jan', mentees: 2, points: 150, hours: 5, engagement: 60 },
    { name: 'Feb', mentees: 3, points: 280, hours: 8, engagement: 75 },
    { name: 'Mar', mentees: 4, points: 390, hours: 12, engagement: 85 },
    { name: 'Apr', mentees: 4, points: 410, hours: 10, engagement: 82 },
    { name: 'May', mentees: 6, points: 550, hours: 18, engagement: 94 },
    { name: 'Jun', mentees: 7, points: 720, hours: 22, engagement: 98 },
  ];

  const studentData = [
    { name: 'Jan', applications: 2, courses: 1, connections: 5, skillGrowth: 30 },
    { name: 'Feb', applications: 5, courses: 2, connections: 12, skillGrowth: 45 },
    { name: 'Mar', applications: 8, courses: 3, connections: 25, skillGrowth: 55 },
    { name: 'Apr', applications: 12, courses: 3, connections: 38, skillGrowth: 70 },
    { name: 'May', applications: 15, courses: 5, connections: 50, skillGrowth: 85 },
    { name: 'Jun', applications: 22, courses: 6, connections: 75, skillGrowth: 95 },
  ];

  const dataToUse = isAlumni ? monthlyData : studentData;

  const StatCard = ({ title, value, trend, icon: Icon, color }) => (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{value}</h3>
        <div className="flex items-center text-sm font-medium" style={{ color }}>
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>+{trend}% this month</span>
        </div>
      </div>
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
        <Icon className="w-8 h-8" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Growth Analytics</h1>
          <p className="text-slate-500 mt-1">Track your progress and engagement over time</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
          {['1M', '3M', '6M', '1Y'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
                timeRange === range 
                  ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isAlumni ? (
          <>
            <StatCard title="Total Mentees" value="24" trend="12" icon={Users} color="#6366f1" />
            <StatCard title="Reward Points" value="1,450" trend="28" icon={Award} color="#f59e0b" />
            <StatCard title="Hours Mentored" value="86" trend="15" icon={Calendar} color="#10b981" />
            <StatCard title="Profile Views" value="4.2k" trend="45" icon={Target} color="#ec4899" />
          </>
        ) : (
          <>
            <StatCard title="Applications" value="48" trend="15" icon={BookOpen} color="#6366f1" />
            <StatCard title="Skill Growth" value="92%" trend="8" icon={TrendingUp} color="#10b981" />
            <StatCard title="Connections" value="156" trend="24" icon={Users} color="#3b82f6" />
            <StatCard title="Interviews" value="7" trend="12" icon={Target} color="#8b5cf6" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Main Growth Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            {isAlumni ? 'Mentorship Engagement' : 'Career Progression Activity'}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataToUse} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Area 
                  type="monotone" 
                  dataKey={isAlumni ? 'points' : 'connections'} 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPrimary)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Secondary Metric Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            {isAlumni ? 'Active Mentees' : 'Skill Growth Matrix'}
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataToUse} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey={isAlumni ? 'mentees' : 'skillGrowth'} radius={[6, 6, 0, 0]}>
                  {dataToUse.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === dataToUse.length - 1 ? '#6366f1' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
