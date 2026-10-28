export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    res.status(500).json({ error: { message: 'The server is missing OPENAI_API_KEY.' } });
    return;
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      res.status(400).json({ error: { message: 'The paper request was not valid JSON.' } });
      return;
    }
  }
  if (body.model !== 'gpt-6-luna' || body.store !== false) {
    res.status(400).json({ error: { message: 'Unsupported request.' } });
    return;
  }

  const upstream = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify(body),
  });
  const payload = await upstream.json().catch(() => ({}));
  res.status(upstream.status).json(payload);
}
