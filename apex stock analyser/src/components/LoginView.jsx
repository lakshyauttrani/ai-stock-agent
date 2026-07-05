import React, { useState } from 'react';

export default function LoginView({ onLogin }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onLogin(token.trim());
    } catch (err) {
      setError(err.message || 'Invalid token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-view">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon large">△</span>
          <h1>APEX</h1>
          <p className="login-subtitle">AI Stock Intelligence Platform</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="token-input" className="login-label">Access Token</label>
          <input
            id="token-input"
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Enter your access token"
            className="login-input"
            autoFocus
            disabled={loading}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-submit" disabled={loading || !token.trim()}>
            {loading ? 'Authenticating...' : 'Enter APEX'}
          </button>
        </form>
        <p className="login-hint">Contact your admin for an access token.</p>
      </div>
    </div>
  );
}
