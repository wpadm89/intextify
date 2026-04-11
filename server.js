const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { scrubRates } = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;
const RATES_FILE = path.join(__dirname, 'rates.json');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

// Schedule the scraper to run once a day at midnight
cron.schedule('0 0 * * *', () => {
    scrubRates();
});

// API: Get Rates
app.get('/api/rates', (req, res) => {
    try {
        if (!fs.existsSync(RATES_FILE)) {
            return res.json({ lastUpdated: new Date().toISOString().split('T')[0], baseRates: {}, overrides: {} });
        }
        const data = JSON.parse(fs.readFileSync(RATES_FILE, 'utf8'));
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read rates database.' });
    }
});

// API: Setup Admin Overrides
app.post('/api/rates/override', (req, res) => {
    const { password, overrides } = req.body;
    
    // Very basic hardcoded auth for the hidden panel
    if (password !== 'admin123') {
        return res.status(401).json({ error: 'Unauthorized.' });
    }

    try {
        let existing = {};
        if (fs.existsSync(RATES_FILE)) {
            existing = JSON.parse(fs.readFileSync(RATES_FILE, 'utf8'));
        }
        
        // Merge new overrides
        existing.overrides = { ...existing.overrides, ...overrides };
        
        fs.writeFileSync(RATES_FILE, JSON.stringify(existing, null, 2));
        res.json({ success: true, message: 'Overrides saved successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save overrides.' });
    }
});

// Serve the hidden admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// If executing server directly, run an initial scrub asynchronously just in case it's empty
if (!fs.existsSync(RATES_FILE)) {
    scrubRates();
}

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Intextify Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
