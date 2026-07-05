import React, { useState } from 'react';
import { runBacktest } from '../backtest.js';

export default function BacktestView() {
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!strategy.trim()) return;
    setLoading(true);
    setResult('');
    setError('');

    try {
      const output = await runBacktest(strategy.trim());
      setResult(output);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backtest-view">
      <div className="search-section">
        <h2>Strategy Backtester</h2>
        <p className="section-desc">Describe a trading strategy to simulate 12-month historical performance</p>
        <form onSubmit={handleSubmit} className="search-form">
          <input
            type="text"
            value={strategy}
            onChange={e => setStrategy(e.target.value)}
            placeholder="Buy NVDA on RSI &lt; 30, sell on RSI &gt; 70..."
            className="search-input wide"
            disabled={loading}
          />
          <button type="submit" className="search-btn" disabled={loading || !strategy.trim()}>
            {loading ? 'Running...' : 'Backtest'}
          </button>
        </form>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Simulating trades...</p>
        </div>
      )}

      {error && <div className="error-box"><span className="error-icon">⚠</span> {error}</div>}

      {result && (
        <div className="backtest-result">
          <div className="disclaimer-box">
            ⚠ This is a SIMULATED backtest. Results do not represent actual historical trading performance.
          </div>
          <pre className="backtest-output">{result}</pre>
        </div>
      )}
    </div>
  );
}
