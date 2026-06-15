import React, { useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/':               { title: 'Dashboard',        sub: "Welcome back! Here's what's happening today." },
  '/customers':      { title: 'Customers',         sub: 'Manage and explore your audience.' },
  '/segments':       { title: 'Audience Builder',  sub: 'Build smart segments with AI.' },
  '/campaigns/new':  { title: 'Campaign Builder',  sub: 'Create AI-powered campaigns.' },
  '/campaigns':      { title: 'Campaign History',  sub: 'Track every campaign in real time.' },
  '/settings':       { title: 'Settings',          sub: 'Manage preferences and data.' },
};

const Header = () => {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const meta = PAGE_TITLES[location.pathname] || PAGE_TITLES['/'];

  return (
    <header
      className="h-16 flex items-center justify-between px-7 border-b flex-shrink-0"
      style={{ background: '#FFF8F4', borderColor: '#F1E3DA' }}
    >
      {/* Left — page title */}
      <div>
        <h1 className="text-base font-bold leading-none" style={{ color: '#2D2A26' }}>
          {meta.title}
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#7A736E' }}>{meta.sub}</p>
      </div>

      {/* Right — search + bell + avatar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border"
          style={{ background: '#FFF8F4', borderColor: '#F1E3DA', width: 260 }}
        >
          <Search size={15} style={{ color: '#B8AFA9' }} />
          <input
            type="text"
            placeholder="Search customers, campaigns…"
            className="bg-transparent border-none outline-none text-sm flex-1"
            style={{ color: '#2D2A26' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Bell */}
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center relative transition-colors"
          style={{ background: '#FFF8F4', border: '1px solid #F1E3DA' }}
          onMouseEnter={e => e.currentTarget.style.background = '#FFE8DE'}
          onMouseLeave={e => e.currentTarget.style.background = '#FFF8F4'}
        >
          <Bell size={16} style={{ color: '#7A736E' }} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
            style={{ background: '#F28C6F' }}
          />
        </button>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer"
          style={{ background: 'linear-gradient(135deg,#F28C6F,#A8C3A0)' }}
        >
          XC
        </div>
      </div>
    </header>
  );
};

export default Header;
