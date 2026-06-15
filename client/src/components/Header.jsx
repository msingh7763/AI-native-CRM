import React, { useContext } from 'react';
import { Bell, Search, Moon, Sun } from 'lucide-react';
import { ThemeContext } from '../App';
import { motion } from 'framer-motion';

const Header = () => {
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 transition-colors duration-200"
    >
      {/* Search */}
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 w-80 border border-slate-200 dark:border-slate-700 transition-colors">
        <Search size={16} className="text-black/50 dark:text-white/60 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search customers, campaigns..."
          className="bg-transparent border-none outline-none text-sm w-full text-black dark:text-white dark:text-white placeholder-slate-400"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-lg text-black/60 dark:text-white/70 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-black/50 dark:text-white/60 dark:hover:text-indigo-400 transition-colors"
          title="Toggle theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="relative p-2 rounded-lg text-black/60 dark:text-white/70 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-black/50 dark:text-white/60 dark:hover:text-indigo-400 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
        </button>

        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 border-2 border-white dark:border-slate-700 shadow-sm ml-1" />
      </div>
    </motion.header>
  );
};

export default Header;
