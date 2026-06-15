import React, { useEffect, useState, useContext, useCallback } from 'react';
import { getAnalytics, generateDemoData } from '../services/api';
import { ThemeContext } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Megaphone, CheckCircle, TrendingUp, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 50 }}
    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white font-medium ${
      type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
    }`}
  >
    {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
    {message}
    <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={16} /></button>
  </motion.div>
);

const StatCard = ({ title, value, icon, colorClass, subtitle }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 card-hover">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-black/60 dark:text-white/70 dark:text-black/50 dark:text-white/60 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-black dark:text-white dark:text-white">{value}</h3>
        {subtitle && <p className="text-xs mt-2 text-emerald-600 dark:text-emerald-400 font-medium">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>{icon}</div>
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
      console.error('Failed to fetch stats', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(true); }, [fetchStats]);
  useEffect(() => {
    if (liveUpdates.length > 0) fetchStats();
  }, [liveUpdates, fetchStats]);

  const handleGenerateData = async () => {
    setGenerating(true);
    try {
      await generateDemoData();
      await fetchStats(true);
      showToast('500 customers & 2000 orders generated!', 'success');
    } catch (error) {
      const msg = error.code === 'ECONNABORTED'
        ? 'Request timed out. Make sure the server is running.'
        : error.response?.data?.message || 'Error generating demo data.';
      showToast(msg, 'error');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-black/50 dark:text-white/60">Loading dashboard...</div>
  );

  const chartData = [
    { name: 'Sent',      value: stats?.totalMessages || 0 },
    { name: 'Delivered', value: Math.round((stats?.deliveryRate / 100) * stats?.totalMessages) || 0 },
    { name: 'Opened',    value: Math.round((stats?.openRate / 100) * stats?.totalMessages) || 0 },
    { name: 'Clicked',   value: Math.round((stats?.clickRate / 100) * stats?.totalMessages) || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white dark:text-white">Dashboard</h1>
          <p className="text-sm text-black/60 dark:text-white/70 dark:text-black/50 dark:text-white/60 mt-1">Welcome back — here's what's happening today.</p>
        </div>
        <button
          onClick={handleGenerateData}
          disabled={generating}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 text-sm"
        >
          {generating ? 'Generating…' : 'Generate Demo Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Customers" value={stats?.totalCustomers || 0}
          icon={<Users size={22} className="text-indigo-600" />}
          colorClass="bg-indigo-50 dark:bg-indigo-900/30"
          subtitle="+12% from last month" />
        <StatCard title="Campaigns Sent" value={stats?.totalCampaigns || 0}
          icon={<Megaphone size={22} className="text-violet-600" />}
          colorClass="bg-violet-50 dark:bg-violet-900/30" />
        <StatCard title="Avg Open Rate" value={`${stats?.openRate || 0}%`}
          icon={<CheckCircle size={22} className="text-emerald-600" />}
          colorClass="bg-emerald-50 dark:bg-emerald-900/30"
          subtitle="+4.2% from last campaign" />
        <StatCard title="Click-Through Rate" value={`${stats?.clickRate || 0}%`}
          icon={<TrendingUp size={22} className="text-cyan-600" />}
          colorClass="bg-cyan-50 dark:bg-cyan-900/30" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-base font-semibold text-black dark:text-white dark:text-white mb-5">Engagement Funnel</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'rgba(79,70,229,0.05)' }}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 13 }}
              />
              <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
