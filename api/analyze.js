// api/analyze.js - Vercel Serverless Function (Node.js runtime)
export default async function handler(req, res) {
  // Consenti solo POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse body (Vercel di solito lo fa già, ma gestiamo anche stringa)
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { analysisType, payload } = body || {};

    // TODO: qui metterai la tua logica reale (Gemini/OpenAI/etc.)
    // Per adesso rispondiamo con un "echo" così verifichi il flusso end-to-end.
    return res.status(200).json({
      ok: true,
      data: {
        received: { analysisType, payload },
        note: 'Mock server OK: /api/analyze accetta POST JSON.',
      },
    });
  } catch (e) {
    console.error('api/analyze error:', e);
    return res.status(400).json({ error: 'Bad Request', details: String(e?.message || e) });
  }
}
