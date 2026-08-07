import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Globe, Users, MessageSquare, MessageCircle, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

const MobileBottomNav = ({ onMenuClick, unreadChatCount }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Network', href: '/network', icon: Globe },
    { name: 'Mentors', href: '/mentorship', icon: Users },
    { name: 'Forum', href: '/forum', icon: MessageSquare },
    { name: 'Chat', href: '/chat', icon: MessageCircle, badge: unreadChatCount },
  ];

  const isActiveRoute = (href) => {
    return location.pathname === href;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe lg:hidden">
      {/* Floating Pill Container */}
      <div className="mx-4 mb-4">
        <div className="flex items-center justify-around h-[4.25rem] px-2 rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-300 z-10 ${
                  isActive 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-2 bg-primary-50 dark:bg-primary-900/30 rounded-2xl -z-10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="relative">
                  <Icon className={`w-[22px] h-[22px] transition-all duration-300 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-2 hover:scale-105'}`} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900 shadow-sm animate-pulse">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] transition-all duration-300 ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
          
          {/* Menu Button */}
          <button
            onClick={onMenuClick}
            className="relative flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-300 z-10 group"
          >
            <Menu className="w-[22px] h-[22px] stroke-2 transition-transform duration-300 group-hover:scale-105" />
            <span className="text-[10px] font-medium transition-all duration-300">Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
