import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate Limiting (max 5 submissions per IP per hour)
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const rateLimitKey = `waitlist_rate_${ip}`;

  try {
    const attempts = await kv.incr(rateLimitKey);
    if (attempts === 1) {
      // Only set the expiry on the FIRST request in a new window —
      // do not call expire/ex on every subsequent increment.
      await kv.expire(rateLimitKey, 3600);
    }
    if (attempts > 5) {
      return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
    }
  } catch (err) {
    console.error('Rate limit error:', err);
  }

  const { name, phone, city, plotSize, estimatedBudget, honeypot } = req.body || {};

  if (honeypot) {
    return res.status(400).json({ error: 'Invalid submission' });
  }

  if (!name || !phone || !city || !plotSize) {
    return res.status(400).json({ error: 'Please fill out all required fields.' });
  }

  const phoneRegex = /^(\+92|0|92)?[3][0-9]{9}$/;
  if (!phoneRegex.test(phone.trim())) {
    return res.status(400).json({ error: 'Invalid Pakistani phone number format.' });
  }

  const entry = {
    id: Date.now().toString(),
    name: name.trim(),
    phone: phone.trim(),
    city: city.trim(),
    plotSize: plotSize.trim(),
    estimatedBudget,
    submittedAt: new Date().toISOString()
  };

  try {
    await kv.lpush('contractor_waitlist', entry);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('KV waitlist error:', err);
    return res.status(500).json({ error: 'Failed to join waitlist' });
  }
}
