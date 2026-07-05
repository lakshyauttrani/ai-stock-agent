import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'apex-dev-secret-change-me';
const VALID_TOKENS = (process.env.VALID_TOKENS || 'demo-token').split(',').map(t => t.trim());
const COOKIE_NAME = 'apex_session';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verify(cookie) {
  if (!cookie) return null;
  const [data, sig] = cookie.split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach(pair => {
    const [k, ...v] = pair.split('=');
    cookies[k.trim()] = v.join('=').trim();
  });
  return cookies;
}

const H = { 'Content-Type': 'application/json' };

export default async function handler(event) {
  const path = event.path || event.rawUrl || '';
  const method = event.httpMethod || 'POST';

  // CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' } };
  }

  // Logout
  if (path.endsWith('/logout')) {
    return {
      statusCode: 200,
      headers: { ...H, 'Set-Cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` },
      body: JSON.stringify({ ok: true }),
    };
  }

  // Check session
  if (path.endsWith('/check')) {
    const cookies = parseCookies(event.headers?.cookie);
    const session = verify(cookies[COOKIE_NAME]);
    if (!session) {
      return { statusCode: 401, headers: H, body: JSON.stringify({ error: 'SESSION_EXPIRED' }) };
    }
    return { statusCode: 200, headers: H, body: JSON.stringify({ ok: true, user: session.user }) };
  }

  // Login
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { token } = body;
  if (!token) {
    return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'Token required' }) };
  }

  const tokenBuf = Buffer.from(token);
  const valid = VALID_TOKENS.some(vt => {
    const vtBuf = Buffer.from(vt);
    if (tokenBuf.length !== vtBuf.length) return false;
    return crypto.timingSafeEqual(tokenBuf, vtBuf);
  });

  if (!valid) {
    return { statusCode: 401, headers: H, body: JSON.stringify({ error: 'Invalid token' }) };
  }

  const payload = { user: token.slice(0, 4) + '****', exp: Date.now() + COOKIE_MAX_AGE * 1000 };
  const cookie = sign(payload);

  return {
    statusCode: 200,
    headers: {
      ...H,
      'Set-Cookie': `${COOKIE_NAME}=${cookie}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
    },
    body: JSON.stringify({ ok: true, user: payload.user }),
  };
}

export { verify, parseCookies, COOKIE_NAME };
