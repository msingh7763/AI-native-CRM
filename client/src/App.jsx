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
  const [liveUpdates, setLiveUpdates] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource(`${API_URL}/webhook/stream`);
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLiveUpdates((prev) => [data, ...prev].slice(0, 10));
    };
    return () => eventSource.close();
  }, []);

  return (
    <ThemeContext.Provider value={{ liveUpdates }}>
      <BrowserRouter>
        <div className="flex h-screen" style={{ background: '#FFF8F4' }}>
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-7">
              <Routes>
                <Route path="/"               element={<Dashboard />} />
                <Route path="/customers"      element={<Customers />} />
                <Route path="/segments"       element={<AudienceBuilder />} />
                <Route path="/campaigns/new"  element={<CampaignBuilder />} />
                <Route path="/campaigns"      element={<CampaignHistory />} />
                <Route path="/settings"       element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}

export default App;
