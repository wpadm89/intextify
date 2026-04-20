import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LINKS_FILE = path.join(__dirname, 'Links.txt');

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
        return null;
    }

    let newlyScrapedRates = {};
    
    // Simple heuristic parser for construction materials
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

            for (const [matId, regexes] of Object.entries(materialKeywords)) {
                if (!newlyScrapedRates[matId]) {
                    for (const rx of regexes) {
                        const keywordRegex = new RegExp(rx, 'gi');
                        let match;
                        while ((match = keywordRegex.exec(bodyText)) !== null) {
                            // Extract a window of text around the matched keyword (80 chars back and forward)
                            const start = Math.max(0, match.index - 80);
                            const end = Math.min(bodyText.length, match.index + rx.source.length + 80);
                            const snippet = bodyText.substring(start, end);
                            
                            // Check if a price exists near the keyword
                            const priceMatches = snippet.match(/Rs\.?\s*(\d{1,4}(?:,\d{3})*(?:\.\d+)?)/gi);
                            
                            if (priceMatches && priceMatches.length > 0) {
                                const prices = priceMatches.map(p => parseFloat(p.replace(/Rs\.?\s*/i, '').replace(/,/g, '')));
                                const validPrice = prices.find(p => p > 10 && p < 100000);
                                if (validPrice) {
                                    newlyScrapedRates[matId] = validPrice;
                                    console.log(`[Scrape Success] Found ${matId} rate: ${validPrice} from ${url}`);
                                    break; 
                                }
                            }
                        }
                        if (newlyScrapedRates[matId]) break;
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to scrub ${url}: ${err.message}`);
        }
    }

    if (Object.keys(newlyScrapedRates).length > 0) {
        console.log("Scrape completed successfully.");
        return newlyScrapedRates;
    } else {
        console.log("Could not extract any clear rates from the provided Links.txt sources today.");
        return null;
    }
};

export { scrubRates };
