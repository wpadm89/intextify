const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { password, overrides } = req.body;
    
    if (password !== 'adnan123') {
        return res.status(401).json({ error: 'Unauthorized.' });
    }

    try {
        let existing = await kv.get('intextify_rates');
        
        if (!existing) {
            existing = { 
                baseRates: {}, 
                overrides: {},
                cityMultipliers: { lahore: 1.0, gujranwala: 0.98, talagang: 1.05, islamabad: 1.03, karachi: 1.08 }
            };
        }

        // Merge new overrides
        existing.overrides = { ...existing.overrides, ...overrides };
        
        await kv.set('intextify_rates', existing);
        return res.status(200).json({ success: true, message: 'Overrides saved successfully.' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to save overrides.' });
    }
};
