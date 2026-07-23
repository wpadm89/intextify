import fs from 'fs';

let code = fs.readFileSync('app.js', 'utf8');
const zeroHtml = `<span class="text-gray-400 text-sm">Enter dimensions</span>`;

// Concrete
code = code.replace(/const dryVol = wetVol \* 1\.54;/, `if (wetVol === 0) {
            const zeroState = \`${zeroHtml}\`;
            const ids = ['res-wet-vol', 'res-dry-vol', 'res-cement-bags', 'res-cement-kg', 'res-sand-cft', 'res-sand-tons', 'res-agg-cft', 'res-agg-tons'];
            ids.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = zeroState; });
            if (typeof concreteChartInstance !== 'undefined' && concreteChartInstance) { concreteChartInstance.destroy(); concreteChartInstance = null; }
            return;
        }
        const dryVol = wetVol * 1.54;`);

// Steel
code = code.replace(/const totalWeight = unitWeight \* length;/, `if (length === 0 || dia === 0) {
            const zeroState = \`${zeroHtml}\`;
            const ids = ['res-steel-unit', 'res-steel-weight', 'res-steel-cost'];
            ids.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = zeroState; });
            return;
        }
        const totalWeight = unitWeight * length;`);

// Plastering
code = code.replace(/const wetVol = isMetric \? \(area \* \(thickness \/ 100\)\) : \(area \* \(thickness \/ 12\)\);/, `if (area === 0) {
            const zeroState = \`${zeroHtml}\`;
            const ids = ['res-plaster-wet', 'res-plaster-dry', 'res-plaster-cement-bags', 'res-plaster-cement-kg', 'res-plaster-sand-cft', 'res-plaster-sand-tons', 'res-plaster-cost'];
            ids.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = zeroState; });
            return;
        }
        const wetVol = isMetric ? (area * (thickness / 100)) : (area * (thickness / 12));`);

// Flooring
code = code.replace(/const roomArea = length \* width;/, `if (length === 0 || width === 0) {
            const zeroState = \`${zeroHtml}\`;
            const ids = ['res-floor-area', 'res-floor-tiles', 'res-floor-boxes', 'res-floor-cement', 'res-floor-sand', 'res-floor-cost'];
            ids.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = zeroState; });
            return;
        }
        const roomArea = length * width;`);

// Paint
code = code.replace(/const netArea = area \* 0\.85;/, `if (area === 0) {
            const zeroState = \`${zeroHtml}\`;
            const ids = ['res-paint-area', 'res-paint-liters', 'res-paint-containers', 'res-primer-liters', 'res-primer-containers', 'res-paint-cost'];
            ids.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = zeroState; });
            return;
        }
        const netArea = area * 0.85;`);

fs.writeFileSync('app.js', code);
console.log('Zero states applied to app.js');
