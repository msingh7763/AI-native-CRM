import React, { useEffect, useState, useContext, useCallback } from 'react';
import { getAnalytics, generateDemoData } from '../services/api';
import { ThemeContext } from '../App';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  Users, Megaphone, TrendingUp, MousePointerClick,
  Sparkles, CheckCircle, AlertCircle, X, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Toast ─────────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 40, scale: 0.95 }}
    className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-medium"
    style={{ background: type === 'success' ? '#A8C3A0' : '#F28C6F', color: '#fff' }}
  >
    {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
    {message}
    <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14} /></button>
  </motion.div>
);

/* ── Stat Card ──────────────────────────────────────────────── */
const StatCard = ({ title, value, icon: Icon, iconBg, iconColor, trend, trendLabel }) => (
  <div
    className="card-hover rounded-2xl p-5 border flex flex-col gap-4"
    style={{ background: '#FFFFFF', borderColor: '#F1E3DA' }}
  >
    <div className="flex items-start justify-between">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={{ background: iconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      {trend !== undefined && (
        <span
          className="flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-lg"
          style={{ background: '#F0FAF0', color: '#5A9A52' }}
        >
          <ArrowUpRight size={12} />
          {trend}%
        </span>
      )}
    </div>
    <div>
      <p className="text-sm font-medium mb-1" style={{ color: '#7A736E' }}>{title}</p>
      <p className="text-3xl font-bold tracking-tight" style={{ color: '#2D2A26' }}>{value}</p>
      {trendLabel && (
        <p className="text-xs mt-1" style={{ color: '#B8AFA9' }}>{trendLabel}</p>
      )}
    </div>
  </div>
);

/* ── Custom Tooltip ─────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-4 py-3 rounded-xl shadow-lg border text-sm"
      style={{ background: '#fff', borderColor: '#F1E3DA' }}
    >
      <p className="font-semibold mb-1" style={{ color: '#2D2A26' }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{p.value.toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
};

/* ── Dashboard ──────────────────────────────────────────────── */
const Dashboard = () => {
  const { liveUpdates } = useContext(ThemeContext);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [generating, setGen]    = useState(false);
  const [toast, setToast]       = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStats = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const { data } = await getAnalytics();
      setStats(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(true); }, [fetchStats]);
  useEffect(() => { if (liveUpdates.length > 0) fetchStats(); }, [liveUpdates, fetchStats]);

  const handleGenerateData = async () => {
    setGen(true);
    try {
      await generateDemoData();
      await fetchStats(true);
      showToast('500 customers & 2000 orders generated!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate data.', 'error');
    } finally { setGen(false); }
  };

  /* Funnel chart data */
  const totalMsg = stats?.totalMessages || 0;
  const chartData = [
    { name: 'Sent',      value: totalMsg },
    { name: 'Delivered', value: Math.round((parseFloat(stats?.deliveryRate || 0) / 100) * totalMsg) },
    { name: 'Opened',    value: Math.round((parseFloat(stats?.openRate || 0) / 100) * totalMsg) },
    { name: 'Clicked',   value: Math.round((parseFloat(stats?.clickRate || 0) / 100) * totalMsg) },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#FFD6C8', borderTopColor: '#F28C6F' }} />
        <p className="text-sm" style={{ color: '#7A736E' }}>Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-7 page-enter">

      {/* ── Top Action Bar ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#2D2A26' }}>Overview</h2>
          <p className="text-sm mt-0.5" style={{ color: '#7A736E' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleGenerateData}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#F28C6F,#E07355)', color: '#fff' }}
        >
          <Sparkles size={15} />
          {generating ? 'Generating…' : 'Generate Demo Data'}
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Customers"
          value={(stats?.totalCustomers || 0).toLocaleString()}
          icon={Users}
          iconBg="#FFF1E8"
          iconColor="#F28C6F"
          trend={12}
          trendLabel="vs last month"
        />
        <StatCard
          title="Campaigns Sent"
          value={(stats?.totalCampaigns || 0).toLocaleString()}
          icon={Megaphone}
          iconBg="#EFF6FF"
          iconColor="#60A5FA"
          trendLabel="All time total"
        />
        <StatCard
          title="Avg Open Rate"
          value={`${stats?.openRate || '0.00'}%`}
          icon={TrendingUp}
          iconBg="#F0FDF4"
          iconColor="#4ADE80"
          trend={4.2}
          trendLabel="vs last campaign"
        />
        <StatCard
          title="Click-Through Rate"
          value={`${stats?.clickRate || '0.00'}%`}
          icon={MousePointerClick}
          iconBg="#FDF4FF"
          iconColor="#C084FC"
          trendLabel="Across all campaigns"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Engagement Funnel — Area Chart */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 border"
          style={{ background: '#FFFFFF', borderColor: '#F1E3DA' }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-base font-bold" style={{ color: '#2D2A26' }}>Engagement Funnel</h3>
              <p className="text-xs mt-0.5" style={{ color: '#7A736E' }}>Message performance across all campaigns</p>
            </div>
            <span
              className="text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ background: '#FFF1E8', color: '#F28C6F' }}
            >
              {totalMsg.toLocaleString()} total messages
            </span>
          </div>

          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="peachGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#F28C6F" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#F28C6F" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="sageGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#A8C3A0" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#A8C3A0" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#F8EDE8" />
                <XAxis
                  dataKey="name"
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 12, fill: '#B8AFA9' }}
                />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 12, fill: '#B8AFA9' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="value" name="Messages"
                  stroke="#F28C6F" strokeWidth={2.5}
                  fill="url(#peachGrad)"
                  dot={{ r: 5, fill: '#F28C6F', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: '#F28C6F', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right — Summary Panel */}
        <div className="flex flex-col gap-4">

          {/* Delivery Stats */}
          <div
            className="rounded-2xl p-5 border flex-1"
            style={{ background: '#FFFFFF', borderColor: '#F1E3DA' }}
          >
            <h3 className="text-sm font-bold mb-4" style={{ color: '#2D2A26' }}>Delivery Breakdown</h3>
            <div className="space-y-3">
              {[
                { label: 'Delivered', value: stats?.deliveryRate || '0.00', color: '#F28C6F', bg: '#FFF1E8' },
                { label: 'Opened',    value: stats?.openRate    || '0.00', color: '#60A5FA', bg: '#EFF6FF' },
                { label: 'Clicked',   value: stats?.clickRate   || '0.00', color: '#4ADE80', bg: '#F0FDF4' },
                { label: 'Failed',    value: totalMsg ? ((( stats?.failed || 0) / totalMsg) * 100).toFixed(2) : '0.00', color: '#F87171', bg: '#FEF2F2' },
              ].map(({ label, value, color, bg }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span style={{ color: '#7A736E' }}>{label}</span>
                    <span className="font-semibold" style={{ color }}>{value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F8EDE8' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(parseFloat(value), 100)}%`, background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div
            className="rounded-2xl p-5 border"
            style={{ background: 'linear-gradient(135deg,#F28C6F,#E07355)', borderColor: 'transparent' }}
          >
            <p className="text-xs font-semibold text-white/70 mb-1">Total Messages Sent</p>
            <p className="text-4xl font-bold text-white">{totalMsg.toLocaleString()}</p>
            <p className="text-xs text-white/60 mt-2">Across {stats?.totalCampaigns || 0} campaigns</p>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
