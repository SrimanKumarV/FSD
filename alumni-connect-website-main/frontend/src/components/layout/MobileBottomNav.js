import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Globe, Sparkles, MessageCircle, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

const MobileBottomNav = ({ onMenuClick, unreadChatCount = 0 }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Network', href: '/network', icon: Globe },
    { name: 'Activity', href: '/activity', icon: Sparkles },
    { name: 'Chat', href: '/chat', icon: MessageCircle, badge: unreadChatCount },
  ];

  const isActiveRoute = (href) => {
    return location.pathname === href;
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden pointer-events-none"
      style={{ paddingBottom: 'var(--alumnex-safe-bottom, 0px)' }}
    >
      {/* Floating Glass Pill Container */}
      <div className="mx-3 sm:mx-4 mb-2.5 pointer-events-auto">
        <nav 
          aria-label="Mobile Navigation"
          className="flex items-center justify-around h-[4.25rem] px-1 rounded-2xl bg-white/92 dark:bg-gray-900/92 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] relative"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`relative flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 transition-colors duration-200 z-10 touch-target ${
                  isActive 
                    ? 'text-primary-600 dark:text-primary-400 font-bold' 
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-x-1.5 inset-y-1.5 bg-primary-50 dark:bg-primary-950/60 rounded-xl -z-10 border border-primary-200/40 dark:border-primary-800/40"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'stroke-[2.5px] scale-105' : 'stroke-2'}`} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white ring-2 ring-white dark:ring-gray-900 shadow-xs">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1 leading-none">
                  {item.name}
                </span>
              </Link>
            );
          })}
          
          {/* Menu Destination (5th primary item) */}
          <button
            onClick={onMenuClick}
            aria-label="Open Navigation Menu"
            className="relative flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium transition-colors duration-200 z-10 touch-target"
          >
            <Menu className="w-5 h-5 stroke-2" />
            <span className="text-xs mt-1 leading-none">Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default MobileBottomNav;
