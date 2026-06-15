import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Filter, Megaphone, History, Settings } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Customers', path: '/customers', icon: <Users size={20} /> },
    { name: 'Audience Builder', path: '/segments', icon: <Filter size={20} /> },
    { name: 'Campaign Builder', path: '/campaigns/new', icon: <Megaphone size={20} /> },
    { name: 'Campaign History', path: '/campaigns', icon: <History size={20} /> },
  ];

  return (
    <div className="w-64 bg-white dark:bg-orange-900 border-r border-red-200 dark:border-yellow-700 h-full flex flex-col transition-colors duration-200">
      <div className="h-16 flex items-center px-6 border-b border-red-200 dark:border-gray-700">
        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center mr-3 text-white">
          <span className="font-bold text-xl">X</span>
        </div>
        <span className="text-xl font-bold dark:">Xeno CRM</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-red-50   dark:bg-gray-800/30 dark: '
                    : '  hover:bg-red-100 dark:  dark:hover:bg-red-700'
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-red-200 dark:border-gray-700">
        <NavLink 
          to="/settings"
          className={({ isActive }) =>
            `flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? 'bg-red-50 dark:bg-gray-800/30'
                : 'hover:bg-red-100 dark:hover:bg-red-700'
            }`
          }
        >
          <Settings size={20} className="mr-3" />
          Settings
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
