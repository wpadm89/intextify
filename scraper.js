const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const LINKS_FILE = path.join(__dirname, 'Links.txt');
const RATES_FILE = path.join(__dirname, 'rates.json');

// Helper to write to JSON
const saveRates = (rates) => {
    try {
        let existing = {};
        if (fs.existsSync(RATES_FILE)) {
            existing = JSON.parse(fs.readFileSync(RATES_FILE, 'utf8'));
        }
        
        existing.lastUpdated = new Date().toISOString().split('T')[0];
        existing.baseRates = { ...existing.baseRates, ...rates };
        
        fs.writeFileSync(RATES_FILE, JSON.stringify(existing, null, 2));
        console.log("Rates successfully scrubbed and updated.");
    } catch (err) {
        console.error("Error saving rates:", err.message);
    }
};

const readLinks = () => {
    try {
        if (!fs.existsSync(LINKS_FILE)) return [];
        const content = fs.readFileSync(LINKS_FILE, 'utf8');
        return content.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('(') && line.startsWith('http'));
    } catch (err) {
        console.error("Error reading Links.txt:", err.message);
        return [];
    }
};

// Main scraper function
const scrubRates = async () => {
    console.log("Initiating daily rate scrub...");
    const urls = readLinks();
    
    if (urls.length === 0) {
        console.log("No valid URLs found in Links.txt. Skipping scrub.");
        return;
    }

    let newlyScrapedRates = {};
    
    // Simple heuristic parser for construction materials
    // Note: Since each website renders differently, we use a regex or string search heuristic 
    // to find generic keywords. For a production app, custom parsing rules per domain are optimal.
    
    const materialKeywords = {
        'bricks': [/brick/i, /awal/i, /awwal/i],
        'cement': [/cement/i, /dg/i, /maple/i, /fauji/i, /bestway/i],
        'sand': [/sand/i, /ravi/i, /chenab/i],
        'crush': [/crush/i, /margalla/i, /sargodha/i],
        'steel': [/steel/i, /rebar/i, /sarya/i, /60 grade/i, /grade 60/i]
    };

    for (const url of urls) {
        try {
            console.log(`Scrubbing: ${url}`);
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IntextifyScraper/1.0'
                },
                timeout: 10000
            });
            const $ = cheerio.load(data);
            const bodyText = $('body').text().replace(/\s+/g, ' ');

            // This is a naive logic mapping that looks for price patterns nearby keywords.
            // Works as a stub for the "Start building your database of rates" intent.
            for (const [matId, regexes] of Object.entries(materialKeywords)) {
                if (!newlyScrapedRates[matId]) {
                    if (regexes.some(rx => rx.test(bodyText))) {
                        // Example: look for "Rs. 123" or "Rs 123"
                        const priceMatches = bodyText.match(/Rs\.?\s*(\d{1,4}(?:,\d{3})*(?:\.\d+)?)/gi);
                        if (priceMatches && priceMatches.length > 0) {
                            // Extract numbers, pick a reasonable one (e.g. median or first)
                            const prices = priceMatches.map(p => parseFloat(p.replace(/Rs\.?\s*/i, '').replace(/,/g, '')));
                            // Just pick the first valid price as a stub heuristic
                            const validPrice = prices.find(p => p > 10 && p < 100000);
                            if (validPrice) {
                                newlyScrapedRates[matId] = validPrice;
                                console.log(`[Scrape Success] Found ${matId} rate: ${validPrice} from ${url}`);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to scrub ${url}: ${err.message}`);
        }
    }

    // If we scraped anything, update the file
    if (Object.keys(newlyScrapedRates).length > 0) {
        saveRates(newlyScrapedRates);
    } else {
        console.log("Could not extract any clear rates from the provided Links.txt sources today.");
    }
};

module.exports = { scrubRates };
