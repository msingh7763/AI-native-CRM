import React, { useEffect, useState, useContext, useCallback } from 'react';
import { getAnalytics, generateDemoData } from '../services/api';
import { ThemeContext } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Megaphone, Send, CheckCircle, TrendingUp, AlertTriangle, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-medium ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`}
  >
    {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
    {message}
    <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={16} /></button>
  </motion.div>
);

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white dark:bg-red-800 rounded-xl p-6 shadow-sm border border-red-100 dark:border-red-700 card-hover">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium dark: mb-1">{title}</p>
        <h3 className="text-3xl font-bold dark:">{value}</h3>
        {subtitle && <p className="text-xs mt-2 dark: font-medium">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { liveUpdates } = useContext(ThemeContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStats = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const { data } = await getAnalytics();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(true);
  }, [fetchStats]);

  useEffect(() => {
    if (liveUpdates.length > 0) {
      fetchStats();
    }
  }, [liveUpdates, fetchStats]);

  const handleGenerateData = async () => {
    setGenerating(true);
    try {
      await generateDemoData();
      await fetchStats(true);
      showToast('500 customers & 2000 orders generated successfully!', 'success');
    } catch (error) {
      const msg = error.code === 'ECONNABORTED'
        ? 'Request timed out. Make sure the server is running on port 5002.'
        : error.response?.data?.message || 'Error generating demo data. Is the server running on port 5002?';
      showToast(msg, 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-8 text-center dark:">Loading dashboard...</div>;

  const chartData = [
    { name: 'Sent', value: stats?.totalMessages || 0 },
    { name: 'Delivered', value: Math.round((stats?.deliveryRate / 100) * stats?.totalMessages) || 0 },
    { name: 'Opened', value: Math.round((stats?.openRate / 100) * stats?.totalMessages) || 0 },
    { name: 'Clicked', value: Math.round((stats?.clickRate / 100) * stats?.totalMessages) || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold dark:text-black">Dashboard Overview</h1>
          <p className="dark:text-black-800">Welcome back! Here's what's happening with your campaigns today.</p>
        </div>
        <button 
          onClick={handleGenerateData} 
          disabled={generating}
          className="bg-orange-950 hover:bg-orange-700   px-4 py-2 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 text-white"
        >
          {generating ? 'Generating demo data...' : 'Generate Demo Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Customers" 
          value={stats?.totalCustomers || 0} 
          icon={<Users size={24} className="" />} 
          color="bg-red-50 dark:bg-gray-800/30"
          subtitle="+12% from last month"
        />
        <StatCard 
          title="Campaigns Sent" 
          value={stats?.totalCampaigns || 0} 
          icon={<Megaphone size={24} className="" />} 
          color="bg-red-50 dark:bg-gray-800/30"
        />
        <StatCard 
          title="Avg Open Rate" 
          value={`${stats?.openRate || 0}%`} 
          icon={<CheckCircle size={24} className="" />} 
          color="bg-red-50 dark:bg-gray-800/30"
          subtitle="+4.2% from last campaign"
        />
        <StatCard 
          title="Click-Through Rate" 
          value={`${stats?.clickRate || 0}%`} 
          icon={<TrendingUp size={24} className="text-orange-600" />} 
          color="bg-orange-50 dark:bg-orange-900/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-orange-800 rounded-xl p-6 shadow-sm border border-red-100 dark:border-gray-700">
          <h2 className="text-lg font-bold dark: mb-4">Engagement Funnel</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        
        
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
