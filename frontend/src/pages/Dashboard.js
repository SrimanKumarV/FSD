import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Code, 
  TrendingUp,
  Clock,
  Star,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  // Mock data - in real app, this would come from API
  const stats = [
    {
      name: 'Mentorship Requests',
      value: user?.role === 'student' ? '3' : '12',
      change: '+12%',
      changeType: 'increase',
      icon: Users,
      color: 'alumni'
    },
    {
      name: 'Job Applications',
      value: user?.role === 'student' ? '8' : '0',
      change: '+5%',
      changeType: 'increase',
      icon: Briefcase,
      color: 'student'
    },
    {
      name: 'Events Registered',
      value: '5',
      change: '+2',
      changeType: 'increase',
      icon: Calendar,
      color: 'primary'
    },
    {
      name: 'Forum Posts',
      value: '12',
      change: '+8%',
      changeType: 'increase',
      icon: MessageSquare,
      color: 'success'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'mentorship',
      title: 'New mentorship request from Sarah Johnson',
      description: 'Looking for guidance in software engineering',
      time: '2 hours ago',
      status: 'pending',
      icon: Users
    },
    {
      id: 2,
      type: 'job',
      title: 'Application submitted for Senior Developer',
      description: 'Google - Mountain View, CA',
      time: '1 day ago',
      status: 'submitted',
      icon: Briefcase
    },
    {
      id: 3,
      type: 'event',
      title: 'Registered for Tech Career Workshop',
      description: 'Hosted by Microsoft Alumni',
      time: '2 days ago',
      status: 'confirmed',
      icon: Calendar
    },
    {
      id: 4,
      type: 'forum',
      title: 'New reply to your post',
      description: 'Career advice for fresh graduates',
      time: '3 days ago',
      status: 'unread',
      icon: MessageSquare
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: 'Tech Career Workshop',
      date: 'Tomorrow, 2:00 PM',
      host: 'Microsoft Alumni',
      type: 'workshop'
    },
    {
      id: 2,
      title: 'Networking Mixer',
      date: 'Friday, 6:00 PM',
      host: 'Alumni Association',
      type: 'networking'
    },
    {
      id: 3,
      title: 'Coding Contest',
      date: 'Sunday, 10:00 AM',
      host: 'Tech Alumni',
      type: 'contest'
    }
  ];

  const quickActions = [
    {
      name: 'Find Mentor',
      description: 'Connect with experienced alumni',
      icon: Users,
      href: '/mentorship',
      color: 'alumni'
    },
    {
      name: 'Browse Jobs',
      description: 'Explore career opportunities',
      icon: Briefcase,
      href: '/jobs',
      color: 'student'
    },
    {
      name: 'Join Event',
      description: 'Attend workshops and seminars',
      icon: Calendar,
      href: '/events',
      color: 'primary'
    },
    {
      name: 'Start Discussion',
      description: 'Share your thoughts in forum',
      icon: MessageSquare,
      href: '/forum',
      color: 'success'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'submitted':
        return 'text-blue-600 bg-blue-100';
      case 'unread':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'submitted':
        return <Info className="w-4 h-4" />;
      case 'unread':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-primary-600 to-alumni-600 rounded-xl p-6 text-white"
      >
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-primary-100">
          Here's what's happening in your professional network today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <TrendingUp className={`w-4 h-4 ml-1 ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {getStatusIcon(activity.status)}
                          <span className="ml-1 capitalize">{activity.status}</span>
                        </span>
                        <span className="text-xs text-gray-400">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <Link to="/dashboard" className="block w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 py-2 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
                View All Activity
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">{event.date}</p>
                      <p className="text-xs text-gray-400">{event.host}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link to="/events" className="block w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 py-2 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
                  View All Events
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      to={action.href}
                      key={action.name}
                      className="block w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${action.color}-100 group-hover:bg-${action.color}-200 transition-colors`}>
                          <Icon className={`w-5 h-5 text-${action.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{action.name}</p>
                          <p className="text-xs text-gray-500">{action.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Progress</h2>
          <Link to="/profile" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View Details
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Profile Complete</p>
            <p className="text-2xl font-bold text-green-600">85%</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Network Score</p>
            <p className="text-2xl font-bold text-blue-600">720</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Growth Rate</p>
            <p className="text-2xl font-bold text-purple-600">+15%</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
