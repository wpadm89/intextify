import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { password, overrides } = req.body;
    
    // Updated Password as requested by user
    if (password !== 'adnan123') {
        return res.status(401).json({ error: 'Unauthorized. Incorrect master key.' });
    }

    try {
        let existingData = await kv.get('intextify_rates') || { overrides: {} };
        
        // Merge new overrides
        existingData.overrides = { ...existingData.overrides, ...overrides };
        existingData.lastUpdated = new Date().toISOString();
        
        await kv.set('intextify_rates', existingData);
        res.status(200).json({ success: true, message: 'Overrides saved successfully to Cloud.' });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to save to Vercel KV.' });
    }
}
