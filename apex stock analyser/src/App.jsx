import React, { useState, useEffect } from 'react';
import { login, checkSession, logout } from './api.js';
import ResearchView from './components/ResearchView.jsx';
import DiscoveryView from './components/DiscoveryView.jsx';
import BacktestView from './components/BacktestView.jsx';
import WatchlistView from './components/WatchlistView.jsx';
import LoginView from './components/LoginView.jsx';

const TABS = [
  { id: 'research', label: 'Research', icon: '🔍' },
  { id: 'discovery', label: 'Discovery', icon: '💡' },
  { id: 'backtest', label: 'Backtest', icon: '📊' },
  { id: 'watchlist', label: 'Watchlist', icon: '⭐' },
];

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('research');

  useEffect(() => {
    checkSession().then(ok => {
      setAuthed(ok);
      setChecking(false);
    }).catch(() => setChecking(false));

    const handler = () => setAuthed(false);
    window.addEventListener('apex:session_expired', handler);
    return () => window.removeEventListener('apex:session_expired', handler);
  }, []);

  const handleLogin = async (token) => {
    await login(token);
    setAuthed(true);
  };

  const handleLogout = async () => {
    await logout();
    setAuthed(false);
  };

  if (checking) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Initializing APEX...</p>
      </div>
    );
  }

  if (!authed) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="logo">
            <span className="logo-icon">△</span> APEX
          </h1>
          <span className="logo-subtitle">AI Stock Intelligence</span>
        </div>
        <nav className="tab-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>
        <button className="logout-btn" onClick={handleLogout} title="Log out">
          ↗ Logout
        </button>
      </header>

      <main className="app-main">
        {activeTab === 'research' && <ResearchView />}
        {activeTab === 'discovery' && <DiscoveryView />}
        {activeTab === 'backtest' && <BacktestView />}
        {activeTab === 'watchlist' && <WatchlistView />}
      </main>

      <footer className="app-footer">
        <p>Not financial advice. All targets are estimates based on AI analysis. Do your own research.</p>
      </footer>
    </div>
  );
}
