import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Sparkles,
  Megaphone, History, Settings, Zap
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard',        path: '/',              icon: LayoutDashboard },
  { name: 'Customers',        path: '/customers',     icon: Users           },
  { name: 'Audience Builder', path: '/segments',      icon: Sparkles        },
  { name: 'Campaign Builder', path: '/campaigns/new', icon: Megaphone       },
  { name: 'Campaign History', path: '/campaigns',     icon: History         },
];

const Sidebar = () => (
  <aside
    className="w-60 flex-shrink-0 flex flex-col h-full border-r"
    style={{ background: '#FFF1E8', borderColor: '#F1E3DA' }}
  >
    {/* Logo */}
    <div className="h-16 flex items-center px-5 border-b" style={{ borderColor: '#F1E3DA' }}>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center mr-2.5 shadow-sm"
        style={{ background: 'linear-gradient(135deg,#F28C6F,#E07355)' }}
      >
        <Zap size={16} className="text-white" fill="white" />
      </div>
      <span className="text-lg font-bold tracking-tight" style={{ color: '#2D2A26' }}>
        Xeno <span style={{ color: '#F28C6F' }}>CRM</span>
      </span>
    </div>

    {/* Navigation */}
    <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
      <p className="px-3 text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#B8AFA9' }}>
        Main Menu
      </p>
      {navItems.map(({ name, path, icon: Icon }) => (
        <NavLink
          key={name}
          to={path}
          end={path === '/'}
          className={({ isActive }) =>
            `nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${
              isActive ? 'nav-active' : ''
            }`
          }
          style={({ isActive }) => ({
            color: isActive ? '#E07355' : '#7A736E',
          })}
        >
          {({ isActive }) => (
            <>
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: isActive ? '#FFF8F4' : 'transparent',
                  color: isActive ? '#F28C6F' : '#B8AFA9',
                }}
              >
                <Icon size={17} />
              </span>
              {name}
            </>
          )}
        </NavLink>
      ))}
    </nav>

    {/* Bottom — Settings */}
    <div className="p-3 border-t" style={{ borderColor: '#F1E3DA' }}>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
            isActive ? 'nav-active' : ''
          }`
        }
        style={({ isActive }) => ({ color: isActive ? '#E07355' : '#7A736E' })}
      >
        {({ isActive }) => (
          <>
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: isActive ? '#FFF8F4' : 'transparent',
                color: isActive ? '#F28C6F' : '#B8AFA9',
              }}
            >
              <Settings size={17} />
            </span>
            Settings
          </>
        )}
      </NavLink>

      {/* User pill */}
      <div
        className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl"
        style={{ background: '#FFE8DE' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#F28C6F,#A8C3A0)' }}
        >
          XC
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: '#2D2A26' }}>Xeno Admin</p>
          <p className="text-xs truncate" style={{ color: '#7A736E' }}>admin@xeno.com</p>
        </div>
      </div>
    </div>
  </aside>
);

export default Sidebar;
