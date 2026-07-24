import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body || {};
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Invalid code provided.' });
  }

  const codeKey = `pro_code:${code.trim().toUpperCase()}`;

  try {
    const exists = await kv.exists(codeKey);
    if (!exists) {
      return res.status(400).json({ error: 'Code not found or invalid.' });
    }

    // Atomic Check-and-Set: hsetnx returns 1 if field was set, 0 if it already existed
    const setSuccess = await kv.hsetnx(codeKey, 'used', 'true');

    if (setSuccess === 1) {
      await kv.hset(codeKey, { redeemedAt: Date.now() });
      return res.status(200).json({ success: true, message: 'Pro unlocked successfully!' });
    } else {
      return res.status(400).json({ error: 'Code has already been used.' });
    }
  } catch (err) {
    console.error('KV redeem error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
