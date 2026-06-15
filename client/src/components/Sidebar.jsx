import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Filter, Megaphone, History, Settings } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard',        path: '/',              icon: <LayoutDashboard size={20} /> },
    { name: 'Customers',        path: '/customers',     icon: <Users size={20} /> },
    { name: 'Audience Builder', path: '/segments',      icon: <Filter size={20} /> },
    { name: 'Campaign Builder', path: '/campaigns/new', icon: <Megaphone size={20} /> },
    { name: 'Campaign History', path: '/campaigns',     icon: <History size={20} /> },
  ];

  return (
    <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 h-full flex flex-col transition-colors duration-200 shadow-sm">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
          <span className="font-bold text-white text-lg">X</span>
        </div>
        <span className="text-xl font-bold text-black dark:text-white dark:text-white tracking-tight">Xeno CRM</span>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-0.5 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                    : 'text-black dark:text-white dark:text-black/50 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <span className="mr-3 opacity-80">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${
              isActive
                ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                : 'text-black dark:text-white dark:text-black/50 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
            }`
          }
        >
          <Settings size={20} className="mr-3 opacity-80" />
          Settings
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
