import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { getCampaigns, getCampaignStats, deleteCampaign } from '../services/api';
import { ThemeContext } from '../App';
import { Megaphone, Clock, BarChart3, Trash2 } from 'lucide-react';

const POLL_INTERVAL = 2500; // poll every 2.5s for running campaigns

/* Animates a number from its previous value to a new value */
const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(parseFloat(value));
  const prevRef = useRef(parseFloat(value));

  useEffect(() => {
    const target = parseFloat(value);
    const start = prevRef.current;
    if (start === target) return;

    const duration = 600;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(parseFloat((start + (target - start) * eased).toFixed(1)));
      if (progress < 1) requestAnimationFrame(step);
      else prevRef.current = target;
    };
    requestAnimationFrame(step);
  }, [value]);

  return <>{display.toFixed(1)}</>;
};

const StatBox = ({ value, label, colorText, colorBg }) => (
  <div className={`${colorBg} rounded-lg p-2 text-center`}>
    <p className={`font-bold text-sm ${colorText}`}>
      <AnimatedNumber value={value} />%
    </p>
    <p className="text-xs opacity-70 mt-0.5">{label}</p>
  </div>
);

const PulsingDot = () => (
  <span className="relative flex h-2 w-2 mr-1.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
  </span>
);

const CampaignCard = ({ campaign, onCompleted, onDeleted }) => {
  const [stats, setStats] = useState(campaign.stats || {
    sent: 0, delivered: 0, opened: 0, clicked: 0, converted: 0,
    failed: 0, pending: 0,
    deliveryRate: '0.0', openRate: '0.0', clickRate: '0.0', conversionRate: '0.0',
  });
  const [status, setStatus] = useState(campaign.status);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pollRef = useRef(null);
  const confirmTimerRef = useRef(null);

  const poll = useCallback(async () => {
    try {
      const res = await getCampaignStats(campaign._id);
      setStats(res.data.stats);
      if (res.data.status === 'Completed' && status !== 'Completed') {
        setStatus('Completed');
        clearInterval(pollRef.current);
        if (onCompleted) onCompleted(campaign._id);
      }
    } catch (_) { /* silent */ }
  }, [campaign._id, status, onCompleted]);

  useEffect(() => {
    if (status !== 'Running') return;
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [status]);

  const handleDeleteClick = () => {
    // first click shows confirm state; auto-reset after 3s if not confirmed
    setConfirmDelete(true);
    confirmTimerRef.current = setTimeout(() => setConfirmDelete(false), 3000);
  };

  const handleDeleteConfirm = async () => {
    clearTimeout(confirmTimerRef.current);
    clearInterval(pollRef.current);
    setDeleting(true);
    try {
      await deleteCampaign(campaign._id);
      if (onDeleted) onDeleted(campaign._id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleDeleteCancel = () => {
    clearTimeout(confirmTimerRef.current);
    setConfirmDelete(false);
  };

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(confirmTimerRef.current), []);

  const isRunning = status === 'Running';
  const totalDispatched = stats.sent || 0;
  const audience = campaign.audienceCount || 0;
  // dispatch progress: how many of the audience have been sent to channel service
  const dispatchPct = audience > 0 ? Math.min((totalDispatched / audience) * 100, 100) : 0;

  return (
    <div className={`bg-white dark:bg-orange-800 rounded-xl shadow-sm border border-red-100 dark:border-gray-700 overflow-hidden flex flex-col transition-opacity duration-300 ${deleting ? 'opacity-40 pointer-events-none' : ''}`}>

      {/* Card body */}
      <div className="p-5 border-b border-red-100 dark:border-gray-700 flex-1">

        {/* Top row: badge + date */}
        <div className="flex justify-between items-center mb-4">
          {isRunning ? (
            <span className="flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300">
              <PulsingDot />
              Running
            </span>
          ) : (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              status === 'Completed'
                ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
            }`}>
              {status}
            </span>
          )}
          <span className="flex items-center text-xs font-medium opacity-70">
            <Clock size={13} className="mr-1" />
            {new Date(campaign.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Title + subject */}
        <h3 className="text-lg font-bold mb-1 line-clamp-1">{campaign.name}</h3>
        <p className="text-sm opacity-70 line-clamp-2 mb-4">{campaign.subjectLine}</p>

        {/* Dispatch progress bar — only while running */}
        {isRunning && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1 opacity-60">
              <span>Dispatching messages</span>
              <span>{totalDispatched} / {audience}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-orange-400 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${dispatchPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats grid — always visible, animates from 0 up */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <StatBox
            value={stats.deliveryRate}
            label="Delivered"
            colorText="text-green-600 dark:text-green-400"
            colorBg="bg-green-50 dark:bg-green-900/20"
          />
          <StatBox
            value={stats.openRate}
            label="Opened"
            colorText="text-blue-600 dark:text-blue-400"
            colorBg="bg-blue-50 dark:bg-blue-900/20"
          />
          <StatBox
            value={stats.clickRate}
            label="Clicked"
            colorText="text-purple-600 dark:text-purple-400"
            colorBg="bg-purple-50 dark:bg-purple-900/20"
          />
          <StatBox
            value={stats.conversionRate}
            label="Orders"
            colorText="text-amber-600 dark:text-amber-400"
            colorBg="bg-amber-50 dark:bg-amber-900/20"
          />
        </div>

        {/* Pending / done line */}
        {isRunning && (
          <p className="text-xs mt-3 opacity-50">
            {stats.pending > 0
              ? `⏳ ${stats.pending} pending · ${stats.delivered} delivered · ${stats.failed} failed`
              : totalDispatched > 0
                ? '✓ All dispatched — waiting for final receipts…'
                : 'Sending…'}
          </p>
        )}
      </div>

      {/* Card footer */}
      <div className="bg-red-50 dark:bg-gray-800/50 px-4 py-3 flex justify-between items-center text-sm">
        <div className="flex items-center font-medium">
          <Megaphone size={15} className="mr-2 text-indigo-500" />
          {campaign.channel}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center font-medium">
            <BarChart3 size={15} className="mr-2" />
            {stats.sent || campaign.audienceCount} sent
          </div>

          {/* Delete control */}
          {!confirmDelete ? (
            <button
              onClick={handleDeleteClick}
              title="Delete campaign"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
              <Trash2 size={15} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 animate-fade-in">
              <span className="text-xs text-red-500 font-medium">Delete?</span>
              <button
                onClick={handleDeleteConfirm}
                className="px-2 py-1 text-xs font-semibold rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Yes
              </button>
              <button
                onClick={handleDeleteCancel}
                className="px-2 py-1 text-xs font-semibold rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Page ─────────────────────────────────────────────────── */
const CampaignHistory = () => {
  const { liveUpdates } = useContext(ThemeContext);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCampaigns = async () => {
    try {
      const res = await getCampaigns();
      setCampaigns(res.data);
      setError('');
    } catch {
      setError('Unable to load campaigns. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  // Re-fetch when a server-sent event arrives (existing SSE mechanism)
  useEffect(() => {
    if (liveUpdates?.length > 0) fetchCampaigns();
  }, [liveUpdates]);

  // When a card transitions to Completed, flip its status in list state
  const handleCompleted = useCallback((id) => {
    setCampaigns(prev => prev.map(c => c._id === id ? { ...c, status: 'Completed' } : c));
  }, []);

  const handleDeleted = useCallback((id) => {
    setCampaigns(prev => prev.filter(c => c._id !== id));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Campaign History</h1>
        <p className="opacity-70 text-sm mt-1">Track and analyze your past broadcasts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 opacity-60">Loading campaigns…</div>
        ) : error ? (
          <div className="col-span-3 text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-red-300">
            {error}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-red-300">
            No campaigns found. Go create one!
          </div>
        ) : (
          campaigns.map(c => (
            <CampaignCard key={c._id} campaign={c} onCompleted={handleCompleted} onDeleted={handleDeleted} />
          ))
        )}
      </div>
    </div>
  );
};

export default CampaignHistory;
