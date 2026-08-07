import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Globe, Briefcase, MessageCircle, Menu } from 'lucide-react';

const MobileBottomNav = ({ onMenuClick, unreadChatCount }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Network', href: '/network', icon: Globe },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Chat', href: '/chat', icon: MessageCircle, badge: unreadChatCount },
  ];

  const isActiveRoute = (href) => {
    return location.pathname === href;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe lg:hidden shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                isActive 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.name}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-primary-500 rounded-b-full -mt-[1px]"></div>
              )}
            </Link>
          );
        })}
        
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="relative flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
        >
          <Menu className="w-6 h-6 stroke-2" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
