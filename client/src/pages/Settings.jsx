import React, { useContext, useState } from 'react';
import { ThemeContext } from '../App';
import { motion } from 'framer-motion';
import { Moon, Sun, Bell, Shield, Database, Check, AlertCircle } from 'lucide-react';
import { clearAnalyticsCache } from '../services/api';

const Settings = () => {
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const [cacheStatus, setCacheStatus] = useState(null); // null, 'loading', 'success', 'error'

  const handleClearCache = async () => {
    setCacheStatus('loading');
    try {
      await clearAnalyticsCache();
      setCacheStatus('success');
      setTimeout(() => setCacheStatus(null), 3000);
    } catch (err) {
      setCacheStatus('error');
      setTimeout(() => setCacheStatus(null), 3000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <h1 className="text-2xl font-bold text-black">Settings</h1>

      <div className="bg-white dark:bg-bg-card-dark rounded-xl shadow-sm border border-red-200 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-red-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold flex items-center">
            <Moon className="mr-2" size={20} /> Appearance
          </h2>
          <p className="text-sm opacity-70 mt-1">Manage your theme preferences.</p>
          
          <div className="mt-4 flex items-center justify-between">
            <span>Dark Mode</span>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${darkMode ? 'bg-primary' : 'bg-red-200'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-red-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold flex items-center">
            <Bell className="mr-2" size={20} /> Notifications
          </h2>
          <p className="text-sm opacity-70 mt-1">Control your email and dashboard alerts.</p>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span>Campaign Delivery Alerts</span>
              <input type="checkbox" defaultChecked className="accent-primary w-4 h-4" />
            </div>
            <div className="flex items-center justify-between">
              <span>Weekly Analytics Report</span>
              <input type="checkbox" className="accent-primary w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-lg font-semibold flex items-center">
            <Database className="mr-2" size={20} /> Data Management
          </h2>
          <p className="text-sm opacity-70 mt-1">Manage your CRM data and cache.</p>
          
          <div className="mt-4 flex items-center">
            <button 
              onClick={handleClearCache}
              disabled={cacheStatus === 'loading'}
              className="bg-secondary text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {cacheStatus === 'loading' ? 'Clearing...' : 'Clear Analytics Cache'}
            </button>
            {cacheStatus === 'success' && (
              <span className="ml-4 text-green-600 dark:text-green-400 flex items-center text-sm font-medium">
                <Check size={16} className="mr-1" /> Cache Cleared!
              </span>
            )}
            {cacheStatus === 'error' && (
              <span className="ml-4 text-primary flex items-center text-sm font-medium">
                <AlertCircle size={16} className="mr-1" /> Failed to clear cache
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
