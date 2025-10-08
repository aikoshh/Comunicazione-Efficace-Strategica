import type { VercelRequest, VercelResponse } from '@vercel/node';
export default function handler(_req: VercelRequest, res: VercelResponse) {
  const apiKeyPresent = !!process.env.GOOGLE_API_KEY;
  res.status(200).json({
    ok: true,
    message: 'Health check passed.',
    env: apiKeyPresent,
    details: apiKeyPresent ? 'GOOGLE_API_KEY is set on the server.' : 'GOOGLE_API_KEY is NOT set on the server.',
  });
}