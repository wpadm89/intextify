const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        let ratesData = await kv.get('intextify_rates');
        
        if (!ratesData) {
            ratesData = {
                lastUpdated: new Date().toISOString().split('T')[0],
                baseRates: {},
                overrides: {},
                cityMultipliers: { lahore: 1.0, gujranwala: 0.98, talagang: 1.05, islamabad: 1.03, karachi: 1.08 }
            };
        }
        
        return res.status(200).json(ratesData);
    } catch (err) {
        return res.status(500).json({ error: 'Failed to read rates database.' });
    }
};
