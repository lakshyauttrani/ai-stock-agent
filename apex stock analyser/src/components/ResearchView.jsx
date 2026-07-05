import React, { useState } from 'react';
import { runPipeline } from '../agents.js';
import { addToWatchlist } from '../watchlist.js';
import SummaryCard from './SummaryCard.jsx';
import AgentProgress from './AgentProgress.jsx';

export default function ResearchView() {
  const [ticker, setTicker] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t = ticker.trim().toUpperCase();
    if (!t) return;

    setRunning(true);
    setResult(null);
    setError('');
    setProgress({ research: 'idle', price: 'idle', growth: 'idle', strategy: 'idle', summary: 'idle' });

    try {
      const res = await runPipeline(t, ({ agent, status }) => {
        setProgress(prev => ({ ...prev, [agent]: status }));
      });
      setResult({ ticker: t, ...res });
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleAddWatchlist = () => {
    if (!result?.summary) return;
    const s = result.summary;
    const added = addToWatchlist({
      ticker: result.ticker,
      price: s.price,
      rating: s.rating,
      target: s.target,
      sentiment: s.sentiment,
      strategy: s.strategy,
    });
    if (added) {
      setWatchlistAdded(true);
      setTimeout(() => setWatchlistAdded(false), 3000);
    }
  };

  const [watchlistAdded, setWatchlistAdded] = useState(false);

  return (
    <div className="research-view">
      <div className="search-section">
        <h2>Stock Research Pipeline</h2>
        <p className="section-desc">Enter a ticker to run the 5-agent analysis pipeline</p>
        <form onSubmit={handleSubmit} className="search-form">
          <input
            type="text"
            value={ticker}
            onChange={e => setTicker(e.target.value.toUpperCase())}
            placeholder="AAPL, TSLA, NVDA..."
            className="search-input"
            disabled={running}
            maxLength={10}
          />
          <button type="submit" className="search-btn" disabled={running || !ticker.trim()}>
            {running ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </div>

      {running && <AgentProgress progress={progress} />}

      {error && (
        <div className="error-box">
          <span className="error-icon">⚠</span> {error}
        </div>
      )}

      {result && result.summary && (
        <>
          <SummaryCard
            ticker={result.ticker}
            summary={result.summary}
            onAddWatchlist={handleAddWatchlist}
            watchlistAdded={watchlistAdded}
          />

          <div className="raw-toggle-section">
            <button className="raw-toggle-btn" onClick={() => setShowRaw(!showRaw)}>
              {showRaw ? '▲ Hide' : '▼ Show'} full agent outputs
            </button>
            {showRaw && (
              <div className="raw-outputs">
                <RawOutput title="Agent 1: Research" text={result.rawOutputs.researchOutput} />
                <RawOutput title="Agent 2: Price" text={result.rawOutputs.priceOutput} />
                <RawOutput title="Agent 3: Growth" text={result.rawOutputs.growthOutput} />
                <RawOutput title="Agent 4: Strategy" text={result.rawOutputs.strategyOutput} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RawOutput({ title, text }) {
  return (
    <div className="raw-output-block">
      <h4>{title}</h4>
      <pre>{text}</pre>
    </div>
  );
}
