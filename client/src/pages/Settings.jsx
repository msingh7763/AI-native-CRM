import React, { useState } from 'react';
import { Bell, Database, Check, AlertCircle, Palette, Shield } from 'lucide-react';
import { clearAnalyticsCache } from '../services/api';

const Section = ({ icon: Icon, title, subtitle, children }) => (
  <div className="rounded-2xl border overflow-hidden" style={{ background:'#fff', borderColor:'#F1E3DA' }}>
    <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor:'#F1E3DA', background:'#FFF8F4' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'#FFD6C8' }}>
        <Icon size={17} style={{ color:'#F28C6F' }} />
      </div>
      <div>
        <h2 className="text-sm font-bold" style={{ color:'#2D2A26' }}>{title}</h2>
        <p className="text-xs" style={{ color:'#7A736E' }}>{subtitle}</p>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button onClick={() => onChange(!checked)}
    className="w-11 h-6 rounded-full flex items-center px-1 transition-colors"
    style={{ background: checked ? '#F28C6F' : '#F1E3DA' }}
  >
    <div className="w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
      style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
  </button>
);

const Settings = () => {
  const [cacheStatus, setCacheStatus] = useState(null);
  const [notifs, setNotifs] = useState({ delivery: true, weekly: false });

  const handleClearCache = async () => {
    setCacheStatus('loading');
    try {
      await clearAnalyticsCache();
      setCacheStatus('success');
      setTimeout(() => setCacheStatus(null), 3000);
    } catch {
      setCacheStatus('error');
      setTimeout(() => setCacheStatus(null), 3000);
    }
  };

  return (
    <div className="max-w-2xl space-y-5 page-enter">
      <div>
        <h2 className="text-xl font-bold" style={{ color:'#2D2A26' }}>Settings</h2>
        <p className="text-sm mt-0.5" style={{ color:'#7A736E' }}>Manage your preferences and data.</p>
      </div>

      <Section icon={Palette} title="Appearance" subtitle="Customize your interface.">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color:'#2D2A26' }}>Theme</p>
            <p className="text-xs mt-0.5" style={{ color:'#7A736E' }}>Light mode is active — dark mode coming soon.</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ background:'#FFF1E8', color:'#F28C6F' }}>
            Light
          </span>
        </div>
      </Section>

      <Section icon={Bell} title="Notifications" subtitle="Control your alerts.">
        <div className="space-y-4">
          {[
            { key:'delivery', label:'Campaign Delivery Alerts', desc:'Get notified when campaign delivery completes.' },
            { key:'weekly',   label:'Weekly Analytics Report',   desc:'Receive a weekly summary of campaign performance.' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color:'#2D2A26' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color:'#7A736E' }}>{desc}</p>
              </div>
              <Toggle checked={notifs[key]} onChange={v => setNotifs(p => ({ ...p, [key]:v }))} />
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Database} title="Data Management" subtitle="Manage your CRM cache and data.">
        <div className="flex items-center gap-4">
          <button onClick={handleClearCache} disabled={cacheStatus === 'loading'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{ background:'linear-gradient(135deg,#F28C6F,#E07355)', color:'#fff' }}>
            <Database size={15} />
            {cacheStatus === 'loading' ? 'Clearing…' : 'Clear Analytics Cache'}
          </button>
          {cacheStatus === 'success' && (
            <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color:'#A8C3A0' }}>
              <Check size={15} /> Cache cleared!
            </span>
          )}
          {cacheStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color:'#F28C6F' }}>
              <AlertCircle size={15} /> Failed to clear cache.
            </span>
          )}
        </div>
        <p className="text-xs mt-3" style={{ color:'#B8AFA9' }}>
          Analytics data is cached for 10 seconds. Clear it to force a fresh fetch from the database.
        </p>
      </Section>

      <Section icon={Shield} title="About" subtitle="Platform information.">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label:'Version',   value:'1.0.0' },
            { label:'Stack',     value:'React + Express + MongoDB' },
            { label:'AI Model',  value:'Gemini 2.5 Flash' },
            { label:'Deployed',  value:'Vercel + Render' },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl" style={{ background:'#FFF8F4', border:'1px solid #F1E3DA' }}>
              <p className="text-xs" style={{ color:'#B8AFA9' }}>{label}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color:'#2D2A26' }}>{value}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default Settings;
