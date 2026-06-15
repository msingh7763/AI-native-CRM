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
      transition={{ duration: 0.5 }}
      className="h-16 bg-white dark:bg-orange-100 border-b border-orange-800 dark:border-red-500 flex items-center justify-between px-6 transition-colors duration-200"
    >
      <div className="flex items-center bg-orange-400 dark:bg-orange-800 rounded-lg px-3 py-2 w-96 transition-colors">
        <Search size={18} className="dark: mr-2" />
        <input 
          type="text" 
          placeholder="Search customers, campaigns..." 
          className="bg-transparent border-none outline-none text-sm w-full dark:"
        />
      </div>

      <div className="flex items-center space-x-4">
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className="p-2 hover:text-primary dark: dark:hover:text-primary rounded-full hover:bg-red-100 dark:hover:bg-olive-800 transition-colors"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="p-2 hover:text-primary dark: dark:hover:text-primary rounded-full hover:bg-red-100 dark:hover:bg-olive-800 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-800 rounded-full text-white"></span>
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-secondary border-2 border-white dark:border-gray-800 shadow-sm"></div>
      </div>
    </motion.header>
  );
};

export default Header;
