import React from 'react';

const AGENTS = [
  { id: 'research', label: 'Research' },
  { id: 'price', label: 'Price' },
  { id: 'growth', label: 'Growth' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'summary', label: 'Summary' },
];

const STATUS_ICON = {
  idle: '○',
  running: '◉',
  done: '●',
  error: '✕',
};

const STATUS_CLASS = {
  idle: 'status-idle',
  running: 'status-running',
  done: 'status-done',
  error: 'status-error',
};

export default function AgentProgress({ progress }) {
  return (
    <div className="agent-progress">
      {AGENTS.map(agent => {
        const status = progress[agent.id] || 'idle';
        return (
          <div key={agent.id} className={`agent-dot ${STATUS_CLASS[status]}`}>
            <span className="dot-icon">{STATUS_ICON[status]}</span>
            <span className="dot-label">{agent.label}</span>
          </div>
        );
      })}
    </div>
  );
}
