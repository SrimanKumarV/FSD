import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  User, 
  Users, 
  Briefcase, 
  Calendar, 
  Code, 
  LogOut,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  CheckCircle,
  Globe,
  Activity,
  Trophy,
  Settings,
  Check,
  LifeBuoy,
  MessagesSquare,
  MessageCircle,
  Megaphone,
  FolderGit2,
  MapPin,
  FileSearch,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import DefaultAvatar from '../DefaultAvatar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    formatNotificationTime 
  } = useNotifications();

  const navigationGroups = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Profile', href: '/profile', icon: User },
      ]
    },
    {
      title: 'Connect & Community',
      items: [
        { name: 'Network', href: '/network', icon: Globe },
        { name: 'Alumni Map', href: '/map', icon: MapPin },
        { name: 'Startups & Businesses', href: '/businesses', icon: Building2 },
        { name: 'Mentorship', href: '/mentorship', icon: Users },
        { name: 'Forum', href: '/forum', icon: MessagesSquare },
        { name: 'Chat', href: '/chat', icon: MessageCircle },
      ]
    },
    {
      title: 'Opportunities',
      items: [
        { name: 'Jobs', href: '/jobs', icon: Briefcase },
        { name: 'Events', href: '/events', icon: Calendar },
        { name: 'Contests', href: '/contests', icon: Code },
        { name: 'Projects', href: '/projects', icon: FolderGit2 },
        { name: 'AI Resume Analyzer', href: '/resume', icon: FileSearch },
      ]
    },
    {
      title: 'Engagement',
      items: [
        { name: 'DevPulse', href: '/devpulse', icon: Activity },
        { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
      ]
    },
    {
      title: 'Support',
      items: [
        { name: 'Feedback', href: '/feedback', icon: Megaphone },
        { name: 'Help Centre', href: '/help-centre', icon: LifeBuoy },
        ...(isAdmin() ? [{ name: 'Admin', href: '/admin', icon: Settings }] : [])
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActiveRoute = (href) => {
    return location.pathname === href;
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    
    // Close notifications dropdown
    setNotificationsOpen(false);

    // Route based on notification type
    switch (notification.type) {
      case 'follow_request':
      case 'follow_accept':
      case 'follow_decline':
      case 'connection-request':
      case 'connection-accepted':
        navigate('/network');
        break;
      case 'forum-reply':
      case 'forum-like':
      case 'forum_reply':
        navigate('/forum');
        break;
      case 'message-received':
        navigate('/chat');
        break;
      case 'mentorship-request':
      case 'mentorship-accepted':
      case 'mentorship-rejected':
        navigate('/mentorship');
        break;
      case 'job-posted':
        navigate('/jobs');
        break;
      case 'event-reminder':
      case 'event-registration':
        navigate('/events');
        break;
      case 'contest-reminder':
      case 'contest-result':
        navigate('/contests');
        break;
      default:
        break;
    }
  };


  return (
    <div className={location.pathname === '/chat' ? 'h-dvh overflow-hidden' : 'min-h-screen'}>
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 w-64 glass-card shadow-xl lg:hidden border-r-0 rounded-none rounded-r-2xl"
          >
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/30 dark:border-gray-700/30">
              <div className="flex items-center gap-2">
                <img loading="lazy" src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full shadow-sm" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-alumni-600 bg-clip-text text-transparent">
                  Alumnex Connect
                </h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="mt-6 px-3">
              <div className="space-y-6 mb-6">
                {navigationGroups.map((group) => (
                  <div key={group.title}>
                    <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {group.title}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                              isActiveRoute(item.href)
                                ? 'bg-primary-100/80 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 shadow-sm'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-primary-600 dark:hover:text-primary-400'
                            }`}
                          >
                            <Icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex ${isSidebarCollapsed ? 'lg:w-24' : 'lg:w-64'} lg:flex-col lg:fixed lg:inset-y-0 lg:p-4 transition-all duration-300`}>
        <div className="flex flex-col flex-grow glass-card border-none rounded-3xl shadow-xl overflow-hidden">
          <div className={`flex items-center h-16 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-6'} border-b border-gray-200/30 dark:border-gray-700/30`}>
            <div 
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title="Toggle Sidebar"
            >
              <img loading="lazy" src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full shadow-sm flex-shrink-0" />
              {!isSidebarCollapsed && (
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-alumni-600 bg-clip-text text-transparent whitespace-nowrap overflow-hidden text-ellipsis">
                  Alumnex Connect
                </h1>
              )}
            </div>
          </div>
          
          <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto mb-4 custom-scrollbar overflow-x-hidden">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                {!isSidebarCollapsed ? (
                  <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 whitespace-nowrap">
                    {group.title}
                  </p>
                ) : (
                  <div className="h-4" />
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        title={isSidebarCollapsed ? item.name : ""}
                        className={`group flex items-center py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                          isActiveRoute(item.href)
                            ? 'bg-primary-100/80 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-primary-600 dark:hover:text-primary-400'
                        } ${isSidebarCollapsed ? 'justify-center px-0 mx-2' : 'px-3'}`}
                      >
                        <Icon className={`${isSidebarCollapsed ? '' : 'mr-3'} h-5 w-5 flex-shrink-0`} />
                        {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-64'}`}>
        {/* Top navigation */}
        <div className="sticky top-0 z-30 glass-nav">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex flex-1 justify-end items-center space-x-4">
              {/* Theme toggle removed from top nav */}
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 text-gray-400 hover:text-primary-500 dark:text-gray-500 dark:hover:text-primary-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl relative transition-all duration-300"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
                  )}
                </button>
                
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 rounded-2xl"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[28rem] overflow-y-auto">
                        {(!notifications || notifications.length === 0) ? (
                          <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center">
                            <Bell className="w-8 h-8 mb-2 text-gray-300 dark:text-gray-600" />
                            No new notifications
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {notifications.map((notification) => (
                              <div 
                                key={notification._id}
                                className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm text-gray-900 dark:text-white ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                                      {notification.title}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                      {notification.content}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {formatNotificationTime(notification.createdAt)}
                                    </p>
                                  </div>
                                  {!notification.isRead && (
                                    <div className="flex-shrink-0 self-center">
                                      <span className="w-2 h-2 bg-primary-500 rounded-full inline-block"></span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-center">
                        <button className="text-xs text-primary-600 hover:text-primary-700 font-medium" onClick={() => { setNotificationsOpen(false); navigate('/notifications'); }}>
                          View all notifications
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-300"
                >
                  {user?.photo && user?.photo !== 'default-avatar.png' ? (
                    <img loading="lazy" src={user.photo} alt={user.name} className="w-9 h-9 rounded-full object-cover shadow-soft" />
                  ) : (
                    <DefaultAvatar className="w-9 h-9 flex-shrink-0" />
                  )}
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white notranslate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize font-medium">{user?.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 rounded-2xl"
                    >
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        View / Edit Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Settings
                      </Link>
                      <Link
                        to="/feedback"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Feedback
                      </Link>
                      <Link
                        to="/help-centre"
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Help Centre
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <div className="flex items-center font-medium">
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign out
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className={location.pathname === '/chat' ? 'h-[calc(100dvh-4rem)] lg:p-4 lg:pt-0 overflow-hidden flex flex-col' : 'py-6'}>
          <div className={location.pathname === '/chat' ? 'h-full w-full glass-card border-none lg:rounded-3xl overflow-hidden' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
            {children}
          </div>
        </main>
      </div>

      {/* Click outside to close dropdowns */}
      {(userMenuOpen || notificationsOpen) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setUserMenuOpen(false);
            setNotificationsOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Layout;
