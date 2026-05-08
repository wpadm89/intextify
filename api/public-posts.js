import { kv } from '@vercel/kv';

export default async function handler(req, res) {

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set cache header — rebuild cache every 5 minutes
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  try {
    const allPosts = (await kv.get('guest_posts')) || [];

    // CRITICAL: Only return approved posts — never expose pending/rejected
    const approvedPosts = allPosts
      .filter(post => post.status === 'approved')
      .map(post => ({
        // Strip email — never expose submitter email publicly
        id:          post.id,
        title:       post.title,
        name:        post.name,
        wordCount:   post.wordCount,
        submittedAt: post.submittedAt,
        reviewedAt:  post.reviewedAt,
        // Truncate content for preview card (first 200 chars)
        preview:     post.content.substring(0, 200).trim() + '...',
        // Full content for modal reader
        content:     post.content
      }));

    return res.status(200).json({
      success: true,
      count:   approvedPosts.length,
      posts:   approvedPosts
    });

  } catch (err) {
    console.error('KV fetch error:', err);
    return res.status(500).json({ error: 'Failed to load articles.' });
  }
}
