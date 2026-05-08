import { kv } from '@vercel/kv';

export default async function handler(req, res) {

  // ── Method Guard ──────────────────────────────────────────────
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── POST: Public Submission ───────────────────────────────────
  if (req.method === 'POST') {

    // Rate Limiting (max 3 submissions per IP per hour)
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    const rateLimitKey = `guest_rate_${ip}`;

    try {
      const attempts = (await kv.get(rateLimitKey)) || 0;
      if (attempts >= 3) {
        return res.status(429).json({
          error: 'Too many submissions. Please try again after 1 hour.'
        });
      }
      await kv.set(rateLimitKey, attempts + 1, { ex: 3600 });
    } catch (kvErr) {
      console.error('KV rate limit error:', kvErr);
      // Non-blocking — proceed even if rate limit KV fails
    }

    // Input Extraction
    const { name, email, title, content } = req.body || {};

    // Server-Side Validation
    if (!name || !email || !title || !content) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({ error: 'Invalid name. Must be 2–100 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }
    if (typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 200) {
      return res.status(400).json({ error: 'Title must be 5–200 characters.' });
    }
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 500) {
      return res.status(400).json({
        error: `Article too short (${wordCount} words). Minimum 500 words required.`
      });
    }
    if (content.length > 20000) {
      return res.status(400).json({ error: 'Article exceeds maximum length of 20,000 characters.' });
    }

    // Build Post Object
    const newPost = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name:      name.trim(),
      email:     email.trim().toLowerCase(),
      title:     title.trim(),
      content:   content.trim(),
      status:    'pending',
      wordCount: wordCount,
      submittedAt: new Date().toISOString()
    };

    // Save to KV
    try {
      const existing = (await kv.get('guest_posts')) || [];
      const updated  = [newPost, ...existing];
      await kv.set('guest_posts', updated);
      return res.status(200).json({ success: true });
    } catch (kvErr) {
      console.error('KV save error:', kvErr);
      return res.status(500).json({ error: 'Failed to save submission. Please try again.' });
    }
  }

  // ── GET & PATCH: Admin Routes — Require Authorization ─────────
  const authHeader = req.headers['authorization'];
  const expectedAuth = `Bearer ${process.env.ADMIN_PASSWORD}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  // ── GET: Fetch All Posts for Admin ────────────────────────────
  if (req.method === 'GET') {
    try {
      const posts = (await kv.get('guest_posts')) || [];
      return res.status(200).json({ success: true, posts });
    } catch (kvErr) {
      console.error('KV fetch error:', kvErr);
      return res.status(500).json({ error: 'Failed to fetch posts.' });
    }
  }

  // ── PATCH: Update Post Status (Approve / Reject) ──────────────
  if (req.method === 'PATCH') {
    const { id, status } = req.body || {};

    if (!id || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid id or status.' });
    }

    try {
      const posts   = (await kv.get('guest_posts')) || [];
      const updated = posts.map(post =>
        post.id === id
          ? { ...post, status, reviewedAt: new Date().toISOString() }
          : post
      );
      await kv.set('guest_posts', updated);
      return res.status(200).json({ success: true });
    } catch (kvErr) {
      console.error('KV update error:', kvErr);
      return res.status(500).json({ error: 'Failed to update post status.' });
    }
  }
}
