// Unified LLM call — routes through our serverless proxy to Gemini
export async function callClaude(system, userMsg, useSearch = false, maxTokens = 1500) {
  const r = await fetch('/.netlify/functions/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ system, userMsg, useSearch, maxTokens }),
  });

  const d = await r.json();

  if (r.status === 401 || d.error === 'SESSION_EXPIRED') {
    window.dispatchEvent(new CustomEvent('apex:session_expired', { detail: 'SESSION_EXPIRED' }));
    throw new Error('Session expired — please log in again.');
  }

  if (d.error) throw new Error(typeof d.error === 'string' ? d.error : d.error.message);

  return d.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}

// Auth helpers
export async function login(token) {
  const r = await fetch('/.netlify/functions/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Login failed');
  return d;
}

export async function checkSession() {
  const r = await fetch('/.netlify/functions/auth?action=check', {
    method: 'POST',
    credentials: 'include',
  });
  const d = await r.json();
  return r.ok && d.ok;
}

export async function logout() {
  await fetch('/.netlify/functions/auth?action=logout', {
    method: 'POST',
    credentials: 'include',
  });
}
