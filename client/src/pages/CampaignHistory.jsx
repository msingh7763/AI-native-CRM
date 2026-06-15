import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { getCampaigns, getCampaignStats, deleteCampaign } from '../services/api';
import { ThemeContext } from '../App';
import { Megaphone, Clock, BarChart3, Trash2, CheckCircle2 } from 'lucide-react';

const POLL_INTERVAL = 2500;
const COMPLETED_EXTRA_POLLS = 4;

const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(parseFloat(value));
  const prevRef = useRef(parseFloat(value));
  useEffect(() => {
    const target = parseFloat(value);
    const start = prevRef.current;
    if (start === target) return;
    const duration = 600, startTime = performance.now();
    const step = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplay(parseFloat((start + (target - start) * e).toFixed(1)));
      if (p < 1) requestAnimationFrame(step);
      else prevRef.current = target;
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{display.toFixed(1)}</>;
};

const StatBox = ({ value, label, color, bg }) => (
  <div className="rounded-xl p-2.5 text-center" style={{ background: bg }}>
    <p className="font-bold text-sm" style={{ color }}><AnimatedNumber value={value} />%</p>
    <p className="text-xs mt-0.5 opacity-70">{label}</p>
  </div>
);

const PulsingDot = () => (
  <span className="relative flex h-2 w-2 mr-1.5">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background:'#F28C6F' }} />
    <span className="relative inline-flex rounded-full h-2 w-2" style={{ background:'#F28C6F' }} />
  </span>
);

const CampaignCard = ({ campaign, onCompleted, onDeleted }) => {
  const [stats, setStats] = useState(campaign.stats || {
    sent:0, delivered:0, opened:0, clicked:0, converted:0,
    failed:0, pending:0,
    deliveryRate:'0.0', openRate:'0.0', clickRate:'0.0', conversionRate:'0.0',
  });
  const [status, setStatus]           = useState(campaign.status);
  const [confirmDelete, setConfirm]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const pollRef       = useRef(null);
  const confirmTimer  = useRef(null);
  const extraPolls    = useRef(0);

  const poll = useCallback(async () => {
    try {
      const res = await getCampaignStats(campaign._id);
      setStats(res.data.stats);
      if (res.data.status === 'Completed' && status !== 'Completed') {
        setStatus('Completed'); extraPolls.current = 0;
        if (onCompleted) onCompleted(campaign._id);
      } else if (res.data.status === 'Completed') {
        extraPolls.current += 1;
        if (extraPolls.current >= COMPLETED_EXTRA_POLLS) clearInterval(pollRef.current);
      }
    } catch { /* silent */ }
  }, [campaign._id, status, onCompleted]);

  useEffect(() => {
    if (status === 'Running') {
      poll();
      pollRef.current = setInterval(poll, POLL_INTERVAL);
      return () => clearInterval(pollRef.current);
    }
    if (status === 'Completed' && parseFloat(campaign.stats?.deliveryRate || '0') === 0 && (campaign.audienceCount||0) > 0) {
      extraPolls.current = 0; poll();
      pollRef.current = setInterval(poll, POLL_INTERVAL);
      return () => clearInterval(pollRef.current);
    }
  }, [status]);

  const handleDeleteClick = () => {
    setConfirm(true);
    confirmTimer.current = setTimeout(() => setConfirm(false), 3000);
  };
  const handleDeleteConfirm = async () => {
    clearTimeout(confirmTimer.current); clearInterval(pollRef.current); setDeleting(true);
    try { await deleteCampaign(campaign._id); if (onDeleted) onDeleted(campaign._id); }
    catch { setDeleting(false); setConfirm(false); }
  };
  const handleDeleteCancel = () => { clearTimeout(confirmTimer.current); setConfirm(false); };
  useEffect(() => () => clearTimeout(confirmTimer.current), []);

  const isRunning = status === 'Running';
  const dispatchPct = (campaign.audienceCount||0) > 0
    ? Math.min(((stats.sent||0) / campaign.audienceCount) * 100, 100) : 0;

  return (
    <div
      className="rounded-2xl border flex flex-col overflow-hidden card-hover transition-opacity duration-300"
      style={{ background:'#fff', borderColor:'#F1E3DA', opacity: deleting ? 0.4 : 1, pointerEvents: deleting ? 'none' : 'auto' }}
    >
      <div className="p-5 flex-1">
        {/* Badge + date */}
        <div className="flex items-center justify-between mb-4">
          {isRunning ? (
            <span className="flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border"
              style={{ background:'#FFF1E8', borderColor:'#FFD6C8', color:'#E07355' }}>
              <PulsingDot /> Running
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border"
              style={{ background:'#F0FDF4', borderColor:'#C6E8C2', color:'#5A9A52' }}>
              <CheckCircle2 size={12} /> Completed
            </span>
          )}
          <span className="flex items-center text-xs" style={{ color:'#B8AFA9' }}>
            <Clock size={12} className="mr-1" />
            {new Date(campaign.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-base mb-1 line-clamp-1" style={{ color:'#2D2A26' }}>{campaign.name}</h3>
        <p className="text-sm mb-4 line-clamp-1" style={{ color:'#7A736E' }}>{campaign.subjectLine}</p>

        {/* Progress bar — running only */}
        {isRunning && (
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1" style={{ color:'#B8AFA9' }}>
              <span>Dispatching</span>
              <span>{stats.sent||0} / {campaign.audienceCount||0}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'#F8EDE8' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width:`${dispatchPct}%`, background:'linear-gradient(90deg,#F28C6F,#E07355)' }} />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatBox value={stats.deliveryRate} label="Delivered" color="#F28C6F" bg="#FFF1E8" />
          <StatBox value={stats.openRate}     label="Opened"    color="#60A5FA" bg="#EFF6FF" />
          <StatBox value={stats.clickRate}    label="Clicked"   color="#C084FC" bg="#FDF4FF" />
          <StatBox value={stats.conversionRate} label="Orders"  color="#4ADE80" bg="#F0FDF4" />
        </div>

        {/* Pending line */}
        {isRunning && (
          <p className="text-xs mt-3" style={{ color:'#B8AFA9' }}>
            {(stats.pending||0) > 0
              ? `⏳ ${stats.pending} pending · ${stats.delivered} delivered · ${stats.failed} failed`
              : (stats.sent||0) > 0 ? '✓ All dispatched — finalising receipts…' : 'Sending…'}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t flex items-center justify-between text-sm"
        style={{ borderColor:'#F8EDE8', background:'#FFFAF7' }}>
        <div className="flex items-center gap-1.5 font-medium" style={{ color:'#7A736E' }}>
          <Megaphone size={14} style={{ color:'#F28C6F' }} />
          {campaign.channel}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium" style={{ color:'#7A736E' }}>
            <BarChart3 size={14} />
            {stats.sent || campaign.audienceCount} sent
          </div>
          {!confirmDelete ? (
            <button onClick={handleDeleteClick}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ color:'#B8AFA9' }}
              onMouseEnter={e => { e.currentTarget.style.background='#FEF2F2'; e.currentTarget.style.color='#F87171'; }}
              onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color='#B8AFA9'; }}>
              <Trash2 size={14} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium" style={{ color:'#F28C6F' }}>Delete?</span>
              <button onClick={handleDeleteConfirm}
                className="px-2 py-1 text-xs font-semibold rounded-lg text-white transition-colors"
                style={{ background:'#F28C6F' }}>Yes</button>
              <button onClick={handleDeleteCancel}
                className="px-2 py-1 text-xs font-semibold rounded-lg border transition-colors"
                style={{ borderColor:'#F1E3DA', color:'#7A736E' }}>No</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const fetchCampaigns = async () => {
    try { const res = await getCampaigns(); setCampaigns(res.data); setError(''); }
    catch { setError('Unable to load campaigns. Is the server running?'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCampaigns(); }, []);
  useEffect(() => { if (liveUpdates?.length > 0) fetchCampaigns(); }, [liveUpdates]);

  const handleCompleted = useCallback((id) => {
    setCampaigns(prev => prev.map(c => c._id === id ? { ...c, status:'Completed' } : c));
  }, []);
  const handleDeleted = useCallback((id) => {
    setCampaigns(prev => prev.filter(c => c._id !== id));
  }, []);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h2 className="text-xl font-bold" style={{ color:'#2D2A26' }}>Campaign History</h2>
        <p className="text-sm mt-0.5" style={{ color:'#7A736E' }}>
          {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor:'#FFD6C8', borderTopColor:'#F28C6F' }} />
        </div>
      ) : error ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor:'#FFD6C8', color:'#F28C6F' }}>
          {error}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor:'#F1E3DA', color:'#B8AFA9' }}>
          No campaigns yet — go create one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map(c => (
            <CampaignCard key={c._id} campaign={c} onCompleted={handleCompleted} onDeleted={handleDeleted} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignHistory;
