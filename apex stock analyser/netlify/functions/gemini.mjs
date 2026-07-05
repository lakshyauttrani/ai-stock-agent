import { verify, parseCookies, COOKIE_NAME } from './auth.mjs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = 'gemini-2.0-flash';
const H = { 'Content-Type': 'application/json' };

export default async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' } };
  }

  // Auth check
  const cookies = parseCookies(event.headers?.cookie);
  const session = verify(cookies[COOKIE_NAME]);
  if (!session) {
    return { statusCode: 401, headers: H, body: JSON.stringify({ error: 'SESSION_EXPIRED' }) };
  }

  if (!GEMINI_API_KEY) {
    return { statusCode: 500, headers: H, body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: H, body: JSON.stringify({ error: 'Invalid request body' }) };
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
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return {
        statusCode: upstream.status,
        headers: H,
        body: JSON.stringify({ error: data.error?.message || 'Gemini API error' }),
      };
    }

    // Normalize response to match the shape the frontend expects
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
    const normalized = { content: [{ type: 'text', text }] };

    return { statusCode: 200, headers: H, body: JSON.stringify(normalized) };
  } catch (err) {
    return { statusCode: 500, headers: H, body: JSON.stringify({ error: err.message }) };
  }
}
