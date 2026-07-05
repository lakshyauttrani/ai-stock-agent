import { callClaude } from './api.js';

const DISCOVERY_LENSES = [
  'Focus on companies with recent major contract wins or partnerships announced in the last 30 days.',
  'Find picks-and-shovels suppliers — companies enabling the theme rather than directly in it.',
  'Surface high short-interest names with improving fundamentals that could squeeze higher.',
  'Look for small-cap or mid-cap companies (under $10B market cap) with explosive growth potential.',
  'Focus on companies with insider buying activity in the past 60 days.',
  'Find companies with strong recurring revenue models and expanding margins.',
  'Surface companies recently upgraded by multiple analysts or gaining institutional ownership.',
  'Look for international or non-US-listed companies benefiting from this theme.',
  'Find companies with patent moats or unique IP advantages in this space.',
  'Surface companies with upcoming catalysts like FDA approvals, earnings, or product launches.',
];

// Persistent exclusion list in localStorage
function getBannedTickers() {
  try {
    return JSON.parse(localStorage.getItem('apex_banned_tickers') || '[]');
  } catch { return []; }
}

function addBannedTickers(tickers) {
  const existing = getBannedTickers();
  const updated = [...new Set([...existing, ...tickers])];
  localStorage.setItem('apex_banned_tickers', JSON.stringify(updated));
}

export function getAllDiscoveredTickers() {
  return getBannedTickers();
}

export function resetDiscoveryHistory() {
  localStorage.setItem('apex_banned_tickers', '[]');
}

export async function discoverStocks(theme) {
  const banned = getBannedTickers();
  const lens = DISCOVERY_LENSES[Math.floor(Math.random() * DISCOVERY_LENSES.length)];

  const banList = banned.length > 0
    ? `\n\nBANNED TICKERS — do NOT return any of these: ${banned.join(', ')}`
    : '';

  const system = `You are a stock discovery specialist. Find 5 promising stock picks for the given investment theme.
${lens}
${banList}

Return ONLY a valid JSON array (no markdown, no backticks, no extra text) with EXACTLY 5 objects:
[
  {
    "ticker": "AAPL",
    "name": "Apple Inc",
    "price": "$180",
    "marketCap": "$2.8T",
    "whyItFits": "max 80 chars explaining theme fit",
    "catalyst": "max 60 chars upcoming catalyst",
    "risk": "max 60 chars primary risk",
    "multibaggerReasons": ["reason 1 max 70 chars", "reason 2", "reason 3"],
    "rating": "STRONG BUY or BUY or HOLD"
  }
]

Use real current tickers. Be creative and diverse — avoid the most obvious names everyone already knows.`;

  const userMsg = `Find 5 stock picks for this theme: "${theme}"`;
  const raw = await callClaude(system, userMsg, true, 8192);

  const stocks = extractStocks(raw);

  // Client-side filter: remove any banned tickers that slipped through
  const filtered = stocks.filter(s => !banned.includes(s.ticker?.toUpperCase()));

  // Add new tickers to ban list for next run
  const newTickers = filtered.map(s => s.ticker?.toUpperCase()).filter(Boolean);
  addBannedTickers(newTickers);

  return filtered;
}

// Robust JSON array extractor (3-pass)
function extractStocks(raw) {
  const text = raw.replace(/```json\n?|```/g, '').trim();

  // Pass 1: full valid array
  try {
    const s = text.indexOf('[');
    const e = text.lastIndexOf(']');
    if (s !== -1 && e > s) {
      const arr = JSON.parse(text.slice(s, e + 1));
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch {}

  // Pass 2: bracket-depth salvage
  const salvaged = [];
  let depth = 0, objStart = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') { if (depth === 0) objStart = i; depth++; }
    else if (text[i] === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        try {
          const obj = JSON.parse(text.slice(objStart, i + 1));
          if (obj.ticker && obj.name) salvaged.push(obj);
        } catch {}
        objStart = -1;
      }
    }
  }
  if (salvaged.length) return salvaged;

  // Pass 3: truncation repair
  try {
    const s = text.indexOf('[');
    if (s !== -1) {
      let partial = text.slice(s);
      let open = 0;
      for (const ch of partial) { if (ch === '{') open++; else if (ch === '}') open--; }
      partial += '}'.repeat(Math.max(0, open)) + ']';
      const arr = JSON.parse(partial);
      if (Array.isArray(arr)) return arr.filter(x => x && x.ticker && x.name);
    }
  } catch {}

  throw new Error('Could not parse discovery response — try a shorter theme.');
}
