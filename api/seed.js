import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const articles = [
    {
      id: `seed_${Date.now()}_1`,
      name: "Admin",
      email: "admin@intextify.com",
      title: "PCC vs RCC in Construction",
      content: "PCC (Plain Cement Concrete) and RCC (Reinforced Cement Concrete) are foundational to civil engineering in Pakistan. While PCC provides a rigid, strong base primarily for foundations and flooring without the need for tensile strength, RCC incorporates steel reinforcement (rebars) to withstand significant tensile stresses. This makes RCC indispensable for load-bearing structures like slabs, beams, and columns in multi-story construction. A common mistake in local construction is substituting RCC with PCC in lintels, which can lead to structural failure under heavy loads. Always consult a structural engineer when deciding the concrete grade and reinforcement ratio for your specific plot size and soil bearing capacity.",
      status: "approved",
      wordCount: 104,
      submittedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      preview: "PCC (Plain Cement Concrete) and RCC (Reinforced Cement Concrete) are foundational to civil engineering in Pakistan. While PCC provides a rigid, strong base primarily for foundations..."
    },
    {
      id: `seed_${Date.now()}_2`,
      name: "Admin",
      email: "admin@intextify.com",
      title: "Marla vs Square Feet Conversions",
      content: "Understanding plot sizes in Pakistan requires a clear grasp of the Marla to Square Feet conversion. While a standard Marla was historically 272.25 sqft, modern urban developments like DHA and Bahria Town have standardized the Marla at 225 sqft to streamline planning and construction calculations. This means a 5 Marla plot in DHA is exactly 1125 sqft (often with dimensions of 25x45), whereas in older city areas, it might be 1361 sqft. Accurately converting these units is critical when estimating materials like bricks, concrete, and steel, as a 20% difference in area directly translates to a massive discrepancy in your final Bill of Quantities (BOQ).",
      status: "approved",
      wordCount: 112,
      submittedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      preview: "Understanding plot sizes in Pakistan requires a clear grasp of the Marla to Square Feet conversion. While a standard Marla was historically 272.25 sqft, modern urban developments..."
    }
  ];

  try {
    const existing = (await kv.get('guest_posts')) || [];
    const updated = [...articles, ...existing];
    await kv.set('guest_posts', updated);
    return res.status(200).json({ success: true, message: 'Seeded 2 articles' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to seed KV', details: err.message });
  }
}
