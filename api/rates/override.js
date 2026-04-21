// TODO: Implement rate limiting to prevent brute-force attacks on this endpoint.
// TODO: Add sync logic to keep rates.json and Vercel KV in consistent state.
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { password, overrides } = req.body;
    
    // Updated Password as requested by user
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized. Incorrect master key.' });
    }

    try {
        let existingData = await kv.get('intextify_rates') || { overrides: {} };
        
        const VALID_KEYS = ['bricks', 'cement', 'sand', 'crush', 'steel', 'labor'];
        const isValid = Object.entries(overrides).every(([key, value]) =>
            VALID_KEYS.includes(key) &&
            typeof value === 'number' &&
            isFinite(value) &&
            value > 0
        );
        if (!isValid) {
            return res.status(400).json({ 
                error: 'Invalid payload. All keys must be known materials and values must be positive numbers.' 
            });
        }

        // Merge new overrides
        existingData.overrides = { ...existingData.overrides, ...overrides };
        existingData.lastUpdated = new Date().toISOString();
        
        await kv.set('intextify_rates', existingData);
        res.status(200).json({ success: true, message: 'Overrides saved successfully to Cloud.' });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to save to Vercel KV.' });
    }
}
