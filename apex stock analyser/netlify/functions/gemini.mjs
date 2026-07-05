import { verify, parseCookies, COOKIE_NAME } from './auth.mjs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = 'gemini-2.0-flash';

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' },
    });
  }

  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const session = verify(cookies[COOKIE_NAME]);
  if (!session) {
    return new Response(JSON.stringify({ error: 'SESSION_EXPIRED' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
      status: 500,
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

  const { system, userMsg, useSearch = false, maxTokens = 1500 } = body;

  const geminiBody = {
    contents: [{ role: 'user', parts: [{ text: userMsg }] }],
    generationConfig: { maxOutputTokens: maxTokens },
  };

  if (system) {
    geminiBody.systemInstruction = { parts: [{ text: system }] };
  }

  if (useSearch) {
    geminiBody.tools = [{ google_search: {} }];
  }

  try {
    const isBearer = GEMINI_API_KEY.startsWith('AQ.') || !GEMINI_API_KEY.startsWith('AIza');
    const url = isBearer
      ? `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
      : `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const headers = { 'Content-Type': 'application/json' };
    if (isBearer) {
      headers['Authorization'] = `Bearer ${GEMINI_API_KEY}`;
    }

    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(geminiBody),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Gemini API error' }), {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
    const normalized = { content: [{ type: 'text', text }] };

    return new Response(JSON.stringify(normalized), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
