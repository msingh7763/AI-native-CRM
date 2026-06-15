import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { getCampaigns, getCampaignStats, deleteCampaign } from '../services/api';
import { ThemeContext } from '../App';
import { Megaphone, Clock, BarChart3, Trash2 } from 'lucide-react';

const POLL_INTERVAL = 2500;      // poll every 2.5s while Running
const COMPLETED_EXTRA_POLLS = 4; // after Completed, poll 4 more times to catch final callbacks

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
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
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
  const extraPollsRef = useRef(0); // counts extra polls after Completed

  const poll = useCallback(async () => {
    try {
      const res = await getCampaignStats(campaign._id);
      setStats(res.data.stats);

      if (res.data.status === 'Completed' && status !== 'Completed') {
        // Just transitioned — keep polling a few more times for straggler callbacks
        setStatus('Completed');
        extraPollsRef.current = 0;
        if (onCompleted) onCompleted(campaign._id);
      } else if (res.data.status === 'Completed' && status === 'Completed') {
        // Already completed — count extra polls then stop
        extraPollsRef.current += 1;
        if (extraPollsRef.current >= COMPLETED_EXTRA_POLLS) {
          clearInterval(pollRef.current);
        }
      }
    } catch (_) { /* silent */ }
  }, [campaign._id, status, onCompleted]);

  useEffect(() => {
    // Start polling for Running campaigns, OR completed-but-zero-stats campaigns
    if (status === 'Running') {
      poll();
      pollRef.current = setInterval(poll, POLL_INTERVAL);
      return () => clearInterval(pollRef.current);
    }
    // Completed campaigns with 0% — poll a few times to recover stats
    if (status === 'Completed' && parseFloat(campaign.stats?.deliveryRate || '0') === 0 && (campaign.audienceCount || 0) > 0) {
      extraPollsRef.current = 0;
      poll();
      pollRef.current = setInterval(poll, POLL_INTERVAL);
      return () => clearInterval(pollRef.current);
    }
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
  // Also show as "needs refresh" if completed but all stats are zero (old broken campaigns)
  const isZeroCompleted = status === 'Completed' && parseFloat(stats.deliveryRate) === 0 && (stats.sent || 0) > 0;
  const totalDispatched = stats.sent || 0;
  const audience = campaign.audienceCount || 0;
  // dispatch progress: how many of the audience have been sent to channel service
  const dispatchPct = audience > 0 ? Math.min((totalDispatched / audience) * 100, 100) : 0;

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-opacity duration-300 ${deleting ? 'opacity-40 pointer-events-none' : ''}`}>

      {/* Card body */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex-1">

        {/* Top row: badge + date */}
        <div className="flex justify-between items-center mb-4">
          {isRunning ? (
            <span className="flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300">
              <PulsingDot />
              Running
            </span>
          ) : (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              status === 'Completed'
                ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-black/60 dark:text-white/70 dark:text-black/50 dark:text-white/60'
            }`}>
              {status}
            </span>
          )}
          <span className="flex items-center text-xs font-medium text-black/50 dark:text-white/60">
            <Clock size={13} className="mr-1" />
            {new Date(campaign.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Title + subject */}
        <h3 className="text-base font-bold text-black dark:text-white dark:text-white mb-1 line-clamp-1">{campaign.name}</h3>
        <p className="text-sm text-black/60 dark:text-white/70 dark:text-black/50 dark:text-white/60 line-clamp-2 mb-4">{campaign.subjectLine}</p>

        {/* Dispatch progress bar — only while running */}
        {isRunning && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1 text-black/50 dark:text-white/60">
              <span>Dispatching</span>
              <span>{totalDispatched} / {audience}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${dispatchPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <StatBox value={stats.deliveryRate} label="Delivered"
            colorText="text-emerald-600 dark:text-emerald-400"
            colorBg="bg-emerald-50 dark:bg-emerald-900/20" />
          <StatBox value={stats.openRate} label="Opened"
            colorText="text-indigo-600 dark:text-indigo-400"
            colorBg="bg-indigo-50 dark:bg-indigo-900/20" />
          <StatBox value={stats.clickRate} label="Clicked"
            colorText="text-violet-600 dark:text-violet-400"
            colorBg="bg-violet-50 dark:bg-violet-900/20" />
          <StatBox value={stats.conversionRate} label="Orders"
            colorText="text-cyan-600 dark:text-cyan-400"
            colorBg="bg-cyan-50 dark:bg-cyan-900/20" />
        </div>

        {isRunning && (
          <p className="text-xs mt-3 text-black/50 dark:text-white/60">
            {stats.pending > 0
              ? `⏳ ${stats.pending} pending · ${stats.delivered} delivered · ${stats.failed} failed`
              : totalDispatched > 0 ? '✓ All dispatched — waiting for receipts…' : 'Sending…'}
          </p>
        )}
      </div>

      {/* Card footer */}
      <div className="bg-slate-50 dark:bg-slate-700/40 px-4 py-3 flex justify-between items-center text-sm">
        <div className="flex items-center font-medium text-black dark:text-white dark:text-white">
          <Megaphone size={15} className="mr-2 text-indigo-500" />
          {campaign.channel}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center font-medium text-black dark:text-white dark:text-white">
            <BarChart3 size={15} className="mr-2" />
            {stats.sent || campaign.audienceCount} sent
          </div>
          {!confirmDelete ? (
            <button onClick={handleDeleteClick} title="Delete campaign"
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
              <Trash2 size={15} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-red-500 font-medium">Delete?</span>
              <button onClick={handleDeleteConfirm}
                className="px-2 py-1 text-xs font-semibold rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors">Yes</button>
              <button onClick={handleDeleteCancel}
                className="px-2 py-1 text-xs font-semibold rounded-md bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 transition-colors">No</button>
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
        <h1 className="text-2xl font-bold text-black dark:text-white dark:text-white">Campaign History</h1>
        <p className="text-sm text-black/60 dark:text-white/70 dark:text-black/50 dark:text-white/60 mt-1">Track and analyze your past broadcasts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-black/50 dark:text-white/60">Loading campaigns…</div>
        ) : error ? (
          <div className="col-span-3 text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-black/60 dark:text-white/70">
            {error}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-black/60 dark:text-white/70">
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
