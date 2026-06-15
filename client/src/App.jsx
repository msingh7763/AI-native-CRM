import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import AudienceBuilder from './pages/AudienceBuilder';
import CampaignBuilder from './pages/CampaignBuilder';
import CampaignHistory from './pages/CampaignHistory';
import Settings from './pages/Settings';
import { API_URL } from './services/api';

export const ThemeContext = createContext();

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState([]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Setup SSE for live dashboard updates
    const eventSource = new EventSource(`${API_URL}/webhook/stream`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLiveUpdates((prev) => [data, ...prev].slice(0, 10)); // keep last 10 updates
    };
    return () => eventSource.close();
  }, []);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, liveUpdates }}>
      <BrowserRouter>
        <div className={`flex h-screen transition-colors duration-200 ${darkMode ? 'dark bg-mist-700 text-slate-700 dark:text-slate-200' : 'bg-red-50 text-slate-700 dark:text-slate-200'}`}>
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/segments" element={<AudienceBuilder />} />
                <Route path="/campaigns/new" element={<CampaignBuilder />} />
                <Route path="/campaigns" element={<CampaignHistory />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}

export default App;
