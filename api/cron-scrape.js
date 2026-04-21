import { kv } from '@vercel/kv';
import { scrubRates } from '../scraper.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Secure endpoint via Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized cron secret' });
    }

    try {
        // TODO Phase 2: Add retry logic (max 3 attempts with 
        // exponential backoff) for failed URL fetches.
        // TODO Phase 2: Add fallback to last known good rates 
        // if all sources fail.
        const newlyScrapedRates = await scrubRates();

        if (newlyScrapedRates && Object.keys(newlyScrapedRates).length > 0) {
            let existing = await kv.get('intextify_rates');
            if (!existing) {
                existing = { 
                    baseRates: {}, 
                    overrides: {},
                    cityMultipliers: { lahore: 1.0, gujranwala: 0.98, talagang: 1.05, islamabad: 1.03, karachi: 1.08 }
                };
            }

            existing.lastUpdated = new Date().toISOString();
            existing.baseRates = { ...existing.baseRates, ...newlyScrapedRates };
            
            await kv.set('intextify_rates', existing);
            return res.status(200).json({ success: true, message: 'Rates updated successfully', data: newlyScrapedRates });
        } else {
            return res.status(200).json({ success: true, message: 'Scraper ran but found no new rates.' });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Scraper execution failed', details: err.message });
    }
};
