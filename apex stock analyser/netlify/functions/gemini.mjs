import { verify, parseCookies, COOKIE_NAME } from './auth.mjs';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const MODEL = 'llama-3.3-70b-versatile';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST,OPTIONS' },
    };
  }

  const cookieHeader = event.headers?.cookie || '';
  const cookies = parseCookies(cookieHeader);
  const session = verify(cookies[COOKIE_NAME]);
  if (!session) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'SESSION_EXPIRED' }) };
  }

  if (!GROQ_API_KEY) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'GROQ_API_KEY not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { system, userMsg, useSearch = false, maxTokens = 1500 } = body;

  const messages = [];
  if (system) {
    messages.push({ role: 'system', content: system });
  }
  messages.push({ role: 'user', content: userMsg });

  const groqBody = {
    model: MODEL,
    messages,
    max_tokens: maxTokens,
    temperature: 0.7,
  };

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(groqBody),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return { statusCode: upstream.status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: data.error?.message || 'Groq API error' }) };
    }

    const text = data.choices?.[0]?.message?.content || '';
    const normalized = { content: [{ type: 'text', text }] };

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(normalized) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) };
  }
};
