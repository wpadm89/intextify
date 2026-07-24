import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers['authorization'];
  const expectedAuth = `Bearer ${process.env.ADMIN_PASSWORD}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const list = (await kv.lrange('contractor_waitlist', 0, -1)) || [];
    return res.status(200).json({ success: true, list });
  } catch (err) {
    console.error('KV fetch waitlist error:', err);
    return res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
}
