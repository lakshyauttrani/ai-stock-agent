import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || 'apex-dev-secret-change-me';
const VALID_TOKENS = (process.env.VALID_TOKENS || 'demo-token').split(',').map(t => t.trim());
const COOKIE_NAME = 'apex_session';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

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

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' },
    });
  }

  if (path.endsWith('/logout')) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`,
      },
    });
  }

  if (path.endsWith('/check')) {
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const session = verify(cookies[COOKIE_NAME]);
    if (!session) {
      return new Response(JSON.stringify({ error: 'SESSION_EXPIRED' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ ok: true, user: session.user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { token } = body;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const tokenBuf = Buffer.from(token);
  const valid = VALID_TOKENS.some(vt => {
    const vtBuf = Buffer.from(vt);
    if (tokenBuf.length !== vtBuf.length) return false;
    return crypto.timingSafeEqual(tokenBuf, vtBuf);
  });

  if (!valid) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = { user: token.slice(0, 4) + '****', exp: Date.now() + COOKIE_MAX_AGE * 1000 };
  const cookie = sign(payload);

  return new Response(JSON.stringify({ ok: true, user: payload.user }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `${COOKIE_NAME}=${cookie}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`,
    },
  });
}

export { verify, parseCookies, COOKIE_NAME };
