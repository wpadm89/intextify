import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    
    try {
        let data = await kv.get('intextify_rates');
        
        // If database is empty, seed the initial structure
        if (!data) {
            data = {
                lastUpdated: new Date().toISOString().split('T')[0],
                baseRates: { bricks: 24, cement: 1450, sand: 55, crush: 105, steel: 282, labor: 420 },
                cityMultipliers: { lahore: 1.0, gujranwala: 0.98, talagang: 1.05, islamabad: 1.03, karachi: 1.08 },
                overrides: {}
            };
            await kv.set('intextify_rates', data);
        }
        res.status(200).json(data);
    } catch (err) {
        // Return the actual error message for debugging instead of a generic string
        res.status(500).json({ error: err.message || 'Failed to connect to Vercel KV.' });
    }
}
