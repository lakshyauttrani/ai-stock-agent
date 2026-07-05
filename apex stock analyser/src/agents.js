import { callClaude } from './api.js';

// ─── Agent 1: Research Agent ─────────────────────────────────────────────────
export async function runResearchAgent(ticker) {
  const system = `You are a stock research analyst. Provide ONLY plain text output — no markdown symbols (#, **, ---, |, backticks). 
Output the following sections separated by blank lines:
COMPANY OVERVIEW: 2-3 sentences about what the company does.
RECENT NEWS: 3 recent dated news items (format: [YYYY-MM-DD] headline and brief summary).
KEY FUNDAMENTALS: Revenue (TTM), EPS (TTM), P/E ratio, Market Cap.
SENTIMENT: One of BULLISH, NEUTRAL, or BEARISH with a one-sentence justification.
TOP RISKS: 3 specific risks, numbered 1-3, each max 60 characters.

Be factual and concise. Use real current data from your search.`;

  const userMsg = `Research the stock ticker ${ticker}. Find current fundamentals, recent news, and analyst sentiment.`;
  return callClaude(system, userMsg, true, 2000);
}

// ─── Agent 2: Price Agent ────────────────────────────────────────────────────
export async function runPriceAgent(ticker) {
  const system = `You are a technical price analyst. Provide ONLY plain text output — no markdown symbols.
Output the following sections separated by blank lines:
CURRENT PRICE: $X.XX (today's change: +/-X.X%)
52-WEEK RANGE: $low — $high
SUPPORT/RESISTANCE: Key support at $X, resistance at $X
RSI: Current RSI reading and interpretation (overbought/neutral/oversold)
TREND: Current trend direction (uptrend/downtrend/sideways)
MOVING AVERAGES: 50-day MA: $X (above/below price), 200-day MA: $X (above/below price)

Use real current market data. Be precise with numbers.`;

  const userMsg = `Get the current price, technical levels, and trend data for ${ticker}.`;
  return callClaude(system, userMsg, true, 1500);
}

// ─── Agent 3: Growth Evaluator ───────────────────────────────────────────────
export async function runGrowthAgent(ticker, researchOutput, priceOutput) {
  const system = `You are a growth evaluation analyst. Based on the research and price data provided, give your forward assessment.
Provide ONLY plain text output — no markdown symbols.
Output these sections:
12-MONTH TARGET: $X.XX with 2-sentence reasoning
BULL CASE: One specific sentence with a catalyst and a number (max 100 chars)
BEAR CASE: One specific sentence with a risk and a number (max 100 chars)
CONFIDENCE: HIGH, MEDIUM, or LOW
HORIZON: SHORT (1-3mo), MEDIUM (3-9mo), or LONG (9-12mo)
UPSIDE: +X% from current price

Do NOT invent new price data — use only what's in the provided research and price sections.`;

  const userMsg = `Evaluate forward growth for ${ticker}.

RESEARCH DATA:
${researchOutput}

PRICE DATA:
${priceOutput}`;

  return callClaude(system, userMsg, false, 1500);
}

// ─── Agent 4: Strategy Picker ────────────────────────────────────────────────
export async function runStrategyAgent(ticker, researchOutput, priceOutput, growthOutput) {
  const system = `You are a trade strategy specialist. Based on all prior analysis, output a concrete trade plan.
Provide ONLY plain text output — no markdown symbols.
Output these sections:
STRATEGY TYPE: One of MOMENTUM, VALUE, SWING, BREAKOUT, DIVIDEND, CONTRARIAN
ENTRY RANGE: $X — $Y (should be 2-5% below current price)
STOP LOSS: $X (should be 8-12% below current price)
TARGET 1 (T1): $X (12-18% above current price)
TARGET 2 (T2): $X (25-35% above current price)
TARGET 3 (T3): $X (40-60% above current price, stretch goal)
POSITION SIZE: Percentage of portfolio (conservative/moderate/aggressive)
KEY CATALYST: One specific upcoming catalyst (max 70 chars)
RATING: One of STRONG BUY, BUY, HOLD, SELL, STRONG SELL

All price levels MUST be consistent with the current price from the price data.`;

  const userMsg = `Create a trade strategy for ${ticker}.

RESEARCH:
${researchOutput}

PRICE:
${priceOutput}

GROWTH EVALUATION:
${growthOutput}`;

  return callClaude(system, userMsg, false, 1500);
}

// ─── Agent 5: Summary Agent (structured extraction) ──────────────────────────
export async function runSummaryAgent(ticker, researchOutput, priceOutput, growthOutput, strategyOutput) {
  // Extract current price from agent outputs for anchoring
  const allText = priceOutput + ' ' + researchOutput;
  const priceMatch = allText.match(/\$([1-9]\d{0,4}(?:\.\d{1,2})?)/);
  const currentPrice = priceMatch ? parseFloat(priceMatch[1]) : null;

  let priceConstraint = '';
  let suggestedLevels = '';

  if (currentPrice) {
    const entry_low = (currentPrice * 0.95).toFixed(2);
    const entry_high = (currentPrice * 0.98).toFixed(2);
    const stop = (currentPrice * 0.90).toFixed(2);
    const t1 = (currentPrice * 1.15).toFixed(2);
    const t2 = (currentPrice * 1.30).toFixed(2);

    priceConstraint = `CRITICAL PRICE CONSTRAINT: Current price is $${currentPrice}. ALL trade levels MUST be within 25% of this price.`;
    suggestedLevels = `Suggested ranges — entry: $${entry_low}-$${entry_high}, stop: $${stop}, T1: $${t1}, T2: $${t2}. Use these as guides.`;
  }

  const system = `You are a summary extraction agent. Your job is to extract and structure data from the 4 agent outputs below into a SINGLE JSON object.
Do NOT do new analysis — only extract what's already stated.
${priceConstraint}
${suggestedLevels}

Return ONLY a valid JSON object (no markdown, no backticks, no extra text) with EXACTLY these fields:
{
  "price": "$X.XX",
  "change": "+X.X%",
  "sentiment": "BULLISH or NEUTRAL or BEARISH",
  "sentimentReason": "one sentence max 90 chars",
  "rating": "STRONG BUY or BUY or HOLD or SELL or STRONG SELL",
  "confidence": "HIGH or MEDIUM or LOW",
  "horizon": "SHORT or MEDIUM or LONG",
  "target": "$X.XX",
  "upside": "+X%",
  "entry": "$X-$Y",
  "stop": "$X",
  "t1": "$X",
  "t2": "$X",
  "strategy": "MOMENTUM or VALUE or SWING or BREAKOUT or DIVIDEND or CONTRARIAN",
  "catalyst": "max 70 chars",
  "overview": "2-sentence company description",
  "mktCap": "$XB",
  "pe": "X.X",
  "week52": "$low-$high",
  "rsi": "X (interpretation)",
  "bullCase": "max 100 chars with catalyst and number",
  "bearCase": "max 100 chars with risk and number",
  "topRisks": ["risk 1 max 60 chars", "risk 2", "risk 3"]
}`;

  const userMsg = `Extract summary for ${ticker} from these agent outputs:

RESEARCH AGENT:
${researchOutput}

PRICE AGENT:
${priceOutput}

GROWTH AGENT:
${growthOutput}

STRATEGY AGENT:
${strategyOutput}`;

  const raw = await callClaude(system, userMsg, false, 2000);

  // Parse the JSON with the robust 3-pass extractor
  let parsed = extractJSON(raw);

  // Price anchoring sanity check
  if (currentPrice && parsed) {
    const entryStr = parsed.entry || '';
    const entryMatch = entryStr.match(/\$([0-9.]+)/);
    if (entryMatch) {
      const entryVal = parseFloat(entryMatch[1]);
      if (entryVal < currentPrice * 0.5 || entryVal > currentPrice * 1.5) {
        // Override with calculated values
        parsed.entry = `$${(currentPrice * 0.95).toFixed(2)}-$${(currentPrice * 0.98).toFixed(2)}`;
        parsed.stop = `$${(currentPrice * 0.90).toFixed(2)}`;
        parsed.t1 = `$${(currentPrice * 1.15).toFixed(2)}`;
        parsed.t2 = `$${(currentPrice * 1.30).toFixed(2)}`;
      }
    }
  }

  return parsed;
}

// ─── Robust JSON Extractor (3-pass) ─────────────────────────────────────────
function extractJSON(raw) {
  const text = raw.replace(/```json\n?|```/g, '').trim();

  // Pass 1: happy path — find { } object
  try {
    const s = text.indexOf('{');
    const e = text.lastIndexOf('}');
    if (s !== -1 && e > s) {
      return JSON.parse(text.slice(s, e + 1));
    }
  } catch {}

  // Pass 2: bracket-depth salvage
  let depth = 0, objStart = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') { if (depth === 0) objStart = i; depth++; }
    else if (text[i] === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        try {
          return JSON.parse(text.slice(objStart, i + 1));
        } catch {}
        objStart = -1;
      }
    }
  }

  // Pass 3: truncation repair
  try {
    const s = text.indexOf('{');
    if (s !== -1) {
      let partial = text.slice(s);
      let open = 0;
      for (const ch of partial) { if (ch === '{') open++; else if (ch === '}') open--; }
      partial += '}'.repeat(Math.max(0, open));
      return JSON.parse(partial);
    }
  } catch {}

  throw new Error('Could not parse summary response');
}

// ─── Full Pipeline Runner ────────────────────────────────────────────────────
export async function runPipeline(ticker, onProgress) {
  const update = (agent, status) => onProgress?.({ agent, status });

  update('research', 'running');
  const researchOutput = await runResearchAgent(ticker);
  update('research', 'done');

  update('price', 'running');
  const priceOutput = await runPriceAgent(ticker);
  update('price', 'done');

  update('growth', 'running');
  const growthOutput = await runGrowthAgent(ticker, researchOutput, priceOutput);
  update('growth', 'done');

  update('strategy', 'running');
  const strategyOutput = await runStrategyAgent(ticker, researchOutput, priceOutput, growthOutput);
  update('strategy', 'done');

  update('summary', 'running');
  const summary = await runSummaryAgent(ticker, researchOutput, priceOutput, growthOutput, strategyOutput);
  update('summary', 'done');

  return {
    summary,
    rawOutputs: { researchOutput, priceOutput, growthOutput, strategyOutput },
  };
}
