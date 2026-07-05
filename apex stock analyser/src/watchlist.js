// Watchlist persistence via localStorage

const STORAGE_KEY = 'apex_watchlist';

export function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

export function addToWatchlist(item) {
  const list = getWatchlist();
  // Don't add duplicates
  if (list.some(w => w.ticker === item.ticker)) return false;
  list.push({ ...item, addedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return true;
}

export function removeFromWatchlist(ticker) {
  const list = getWatchlist().filter(w => w.ticker !== ticker);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function clearWatchlist() {
  localStorage.setItem(STORAGE_KEY, '[]');
}
