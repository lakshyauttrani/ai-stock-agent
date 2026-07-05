import React, { useState, useEffect } from 'react';
import { getWatchlist, removeFromWatchlist, clearWatchlist } from '../watchlist.js';

export default function WatchlistView() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getWatchlist());
  }, []);

  const handleRemove = (ticker) => {
    removeFromWatchlist(ticker);
    setItems(getWatchlist());
  };

  const handleClear = () => {
    if (window.confirm('Clear entire watchlist?')) {
      clearWatchlist();
      setItems([]);
    }
  };

  return (
    <div className="watchlist-view">
      <div className="watchlist-header">
        <div>
          <h2>Watchlist</h2>
          <p className="section-desc">{items.length} stock{items.length !== 1 ? 's' : ''} tracked</p>
        </div>
        {items.length > 0 && (
          <button className="text-btn danger" onClick={handleClear}>Clear all</button>
        )}
      </div>

      {items.length === 0 && (
        <div className="empty-state">
          <p>No stocks in watchlist yet.</p>
          <p className="empty-hint">Use Research or Discovery to find stocks, then add them here.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="watchlist-table">
          <div className="wl-row wl-header-row">
            <span>Ticker</span>
            <span>Price</span>
            <span>Rating</span>
            <span>Target</span>
            <span>Sentiment</span>
            <span>Strategy</span>
            <span>Added</span>
            <span></span>
          </div>
          {items.map(item => (
            <div key={item.ticker} className="wl-row">
              <span className="wl-ticker">{item.ticker}</span>
              <span>{item.price || '—'}</span>
              <span className={`wl-rating ${(item.rating || '').toLowerCase().replace(/\s/g, '-')}`}>
                {item.rating || '—'}
              </span>
              <span>{item.target || '—'}</span>
              <span>{item.sentiment || '—'}</span>
              <span>{item.strategy || '—'}</span>
              <span className="wl-date">
                {item.addedAt ? new Date(item.addedAt).toLocaleDateString() : '—'}
              </span>
              <button className="wl-remove" onClick={() => handleRemove(item.ticker)} title="Remove">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
