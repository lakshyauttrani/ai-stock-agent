import { callClaude } from './api.js';

export async function runBacktest(strategy) {
  const system = `You are a quantitative backtesting analyst. Given a trading strategy description, simulate historical performance over the past 12 months.
Provide ONLY plain text output — no markdown.

Output these sections:
STRATEGY: Name and brief description
PERIOD: Last 12 months (state specific date range)
SIMULATED TRADES: List 6-8 hypothetical trades with entry date, exit date, entry price, exit price, % return
WIN RATE: X% (wins/total)
AVERAGE GAIN: +X% per winning trade
AVERAGE LOSS: -X% per losing trade
MAX DRAWDOWN: -X% from peak
TOTAL RETURN: +X% over the period
SHARPE RATIO: X.XX (approximate)
KEY INSIGHT: One sentence about what worked and what didn't

Note: This is a SIMULATED backtest based on typical market conditions for this strategy type. It is NOT based on actual historical trade execution. State this clearly.`;

  const userMsg = `Backtest this strategy over the past 12 months: "${strategy}"`;
  return callClaude(system, userMsg, true, 3000);
}
