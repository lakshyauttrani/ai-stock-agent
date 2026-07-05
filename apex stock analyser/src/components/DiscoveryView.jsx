import React, { useState } from 'react';
import { discoverStocks, getAllDiscoveredTickers, resetDiscoveryHistory } from '../discovery.js';
import { addToWatchlist } from '../watchlist.js';

export default function DiscoveryView() {
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [error, setError] = useState('');
  const [partial, setPartial] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [addedTickers, setAddedTickers] = useState(new Set());

  const handleDiscover = async (e) => {
    e.preventDefault();
    if (!theme.trim()) return;
    setLoading(true);
    setStocks([]);
    setError('');
    setPartial('');

    try {
      const results = await discoverStocks(theme.trim());
      if (results.length < 5 && results.length > 0) {
        setPartial(`Partial: recovered ${results.length} of 5`);
      }
      setStocks(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    resetDiscoveryHistory();
    setStocks([]);
    setPartial('');
  };

  const handleAdd = (stock) => {
    addToWatchlist({
      ticker: stock.ticker,
      price: stock.price,
      rating: stock.rating,
      target: '—',
      sentiment: '—',
      strategy: '—',
    });
    setAddedTickers(prev => new Set([...prev, stock.ticker]));
  };

  const allDiscovered = getAllDiscoveredTickers();

  return (
    <div className="discovery-view">
      <div className="search-section">
        <h2>Stock Discovery</h2>
        <p className="section-desc">Enter an investment theme to discover 5 fresh stock picks</p>
        <form onSubmit={handleDiscover} className="search-form">
          <input
            type="text"
            value={theme}
            onChange={e => setTheme(e.target.value)}
            placeholder="AI infrastructure, clean energy, cybersecurity..."
            className="search-input wide"
            disabled={loading}
          />
          <button type="submit" className="search-btn" disabled={loading || !theme.trim()}>
            {loading ? 'Discovering...' : 'Discover'}
          </button>
        </form>
        <div className="discovery-actions">
          <button className="text-btn" onClick={handleReset}>🔄 Reset history</button>
          <button className="text-btn" onClick={() => setShowHistory(!showHistory)}>
            📚 All previously discovered ({allDiscovered.length})
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner" />
          <p>Searching for unique picks...</p>
        </div>
      )}

      {error && <div className="error-box"><span className="error-icon">⚠</span> {error}</div>}
      {partial && <div className="warning-box"><span>⚡</span> {partial}</div>}

      {stocks.length > 0 && (
        <div className="discovery-grid">
          {stocks.map((stock, i) => (
            <div key={stock.ticker || i} className="discovery-card">
              <div className="disc-card-header">
                <span className="disc-ticker">{stock.ticker}</span>
                <span className="disc-rating">{stock.rating}</span>
              </div>
              <h3 className="disc-name">{stock.name}</h3>
              <div className="disc-meta">
                <span>{stock.price}</span>
                <span>{stock.marketCap}</span>
              </div>
              <p className="disc-why">{stock.whyItFits}</p>
              <div className="disc-details">
                <p><strong>Catalyst:</strong> {stock.catalyst}</p>
                <p><strong>Risk:</strong> {stock.risk}</p>
              </div>
              {stock.multibaggerReasons && (
                <ul className="disc-reasons">
                  {stock.multibaggerReasons.map((r, j) => <li key={j}>{r}</li>)}
                </ul>
              )}
              <button
                className="disc-add-btn"
                onClick={() => handleAdd(stock)}
                disabled={addedTickers.has(stock.ticker)}
              >
                {addedTickers.has(stock.ticker) ? '✓ Added' : '+ Watchlist'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showHistory && (
        <div className="history-panel">
          <h3>All Previously Discovered Tickers</h3>
          {allDiscovered.length === 0 && <p className="empty-text">No tickers discovered yet.</p>}
          <div className="history-tickers">
            {allDiscovered.map(t => <span key={t} className="history-chip">{t}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}
