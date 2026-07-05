import React from 'react';

const SENTIMENT_COLORS = { BULLISH: '#10b981', NEUTRAL: '#f59e0b', BEARISH: '#ef4444' };
const RATING_COLORS = { 'STRONG BUY': '#10b981', 'BUY': '#34d399', 'HOLD': '#f59e0b', 'SELL': '#f87171', 'STRONG SELL': '#ef4444' };

export default function SummaryCard({ ticker, summary, onAddWatchlist, watchlistAdded }) {
  const s = summary;
  if (!s) return null;

  return (
    <div className="summary-card">
      {/* Header */}
      <div className="card-header">
        <div className="card-header-left">
          <h2 className="card-ticker">{ticker}</h2>
          <span className="badge" style={{ background: SENTIMENT_COLORS[s.sentiment] || '#6b7280' }}>
            {s.sentiment}
          </span>
          <span className="card-price">{s.price}</span>
          <span className={`card-change ${s.change?.startsWith('-') ? 'negative' : 'positive'}`}>
            {s.change}
          </span>
        </div>
        <div className="card-header-right">
          <span className="rating-pill" style={{ background: RATING_COLORS[s.rating] || '#6b7280' }}>
            {s.rating}
          </span>
          <span className="card-meta">{s.confidence} confidence · {s.horizon} term</span>
        </div>
      </div>

      {/* Sentiment reason */}
      <p className="card-sentiment-reason">{s.sentimentReason}</p>

      {/* About */}
      <div className="card-section">
        <h3>About {ticker}</h3>
        <p>{s.overview}</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-row">
        <MetricBox label="12M Target" value={s.target} sub={s.upside ? `${s.upside} upside` : '—'} />
        <MetricBox label="Market Cap" value={s.mktCap || '—'} />
        <MetricBox label="P/E" value={s.pe || '—'} />
        <MetricBox label="52-Week" value={s.week52 || '—'} />
        <MetricBox label="RSI" value={s.rsi || '—'} />
      </div>

      {/* Bull / Bear */}
      <div className="bull-bear-row">
        <div className="case-box bull">
          <h4>Bull Case</h4>
          <p>{s.bullCase || '—'}</p>
        </div>
        <div className="case-box bear">
          <h4>Bear Case</h4>
          <p>{s.bearCase || '—'}</p>
        </div>
      </div>

      {/* Risks */}
      <div className="risks-box">
        <h4>⚠ Key Risks</h4>
        <ol>
          {(s.topRisks || []).map((r, i) => <li key={i}>{r}</li>)}
          {(!s.topRisks || s.topRisks.length === 0) && <li>—</li>}
        </ol>
      </div>

      {/* Trade Levels */}
      <div className="trade-levels-row">
        <TradeChip label="Entry" value={s.entry} sub="Ideal buy zone" />
        <TradeChip label="Stop" value={s.stop} sub="Exit if broken" />
        <TradeChip label="T1" value={s.t1} sub="First target" />
        <TradeChip label="T2" value={s.t2} sub="Full target" />
      </div>

      {/* Strategy */}
      <div className="strategy-row">
        <span className="strategy-badge">{s.strategy}</span>
        {s.catalyst && <span className="catalyst-text">Catalyst: {s.catalyst}</span>}
      </div>

      {/* Actions */}
      <div className="card-actions">
        <button className="watchlist-btn" onClick={onAddWatchlist} disabled={watchlistAdded}>
          {watchlistAdded ? '✓ Added to Watchlist!' : '+ Add to Watchlist'}
        </button>
        {watchlistAdded && <span className="watchlist-hint">Navigate to Watchlist → to view it</span>}
      </div>
    </div>
  );
}

function MetricBox({ label, value, sub }) {
  return (
    <div className="metric-box">
      <span className="metric-label">{label}</span>
      <span className={`metric-value ${!value || value === '—' ? 'empty' : ''}`}>{value || '—'}</span>
      {sub && <span className="metric-sub">{sub}</span>}
    </div>
  );
}

function TradeChip({ label, value, sub }) {
  return (
    <div className="trade-chip">
      <span className="trade-chip-label">{label}</span>
      <span className="trade-chip-value">{value || '—'}</span>
      <span className="trade-chip-sub">{sub}</span>
    </div>
  );
}
