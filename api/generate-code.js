import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers['authorization'];
  const expectedAuth = `Bearer ${process.env.ADMIN_PASSWORD}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));

    await kv.hset(`pro_code:${code}`, { createdAt: Date.now() });
    
    return res.status(200).json({ success: true, code });
  } catch (err) {
    console.error('KV generation error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
