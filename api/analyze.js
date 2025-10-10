// api/analyze.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { analysisType, payload } = body || {};
    return res.status(200).json({ ok: true, data: { echo: { analysisType, payload } } });
  } catch (e) {
    console.error('api/analyze error:', e);
    return res.status(400).json({ error: 'Bad Request', details: String(e?.message || e) });
  }
}
