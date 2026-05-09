const fs = require('fs');
const path = require('path');

const cssAddition = fs.readFileSync('header.css', 'utf-8');
const htmlHeader = fs.readFileSync('header.html', 'utf-8');

// CSS File
let cssContent = fs.readFileSync('styles.css', 'utf-8');
const importStr = "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');";

if (!cssContent.includes("@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans")) {
    if (cssContent.includes('@tailwind base;')) {
        cssContent = cssContent.replace('@tailwind base;', importStr + '\n@tailwind base;');
    } else {
        cssContent = importStr + '\n' + cssContent;
    }
}

if (!cssContent.includes('.nav-header {')) {
    cssContent += '\n' + cssAddition;
}
fs.writeFileSync('styles.css', cssContent);
console.log('Updated styles.css');

// HTML Files
const htmlFiles = ['index.html', 'guides.html', 'guide-5-marla.html', 'admin.html', 'write-for-us.html'];
const toRemove = ['flex-row', 'lg:flex-row', 'ml-64', 'pl-64', 'overflow-hidden', 'h-screen'];

function removeClasses(match, tagName, classesStr) {
    let classes = classesStr.split(/\s+/);
    let newClasses = classes.filter(c => !toRemove.includes(c));
    if (classes.includes('h-screen') && !newClasses.includes('min-h-screen')) {
        newClasses.push('min-h-screen');
    }
    return `<${tagName} class="${newClasses.join(' ')}"`;
}

for (const file of htmlFiles) {
    if (!fs.existsSync(file)) {
        console.log(`Skipping ${file}, not found`);
        continue;
    }

    let content = fs.readFileSync(file, 'utf-8');

    content = content.replace(/<(body)\s+class="([^"]*)"/g, removeClasses);
    content = content.replace(/<(div)\s+class="([^"]*dashboard-layout[^"]*)"/g, removeClasses);
    content = content.replace(/<(div)\s+class="([^"]*flex\s+h-screen\s+overflow-hidden[^"]*)"/g, removeClasses);

    if (!content.includes('id="mainHeader"')) {
        content = content.replace(/(<body[^>]*>)/, `$1\n${htmlHeader}`);
    }

    // Comment out old sidebar safely
    const asideRegex = /(<aside[^>]*\b(?:sidebar|nav-sidebar)[^>]*>[\s\S]*?<\/aside>)/i;
    const match = content.match(asideRegex);
    if (match) {
        if (!match[1].includes('<!-- OLD SIDEBAR')) {
            content = content.replace(match[1], `<!-- OLD SIDEBAR — DO NOT DELETE\n${match[1]}\n-->`);
        }
    } else {
        const fallbackRegex = /(<aside[^>]*id="sidebar"[^>]*>[\s\S]*?<\/aside>)/i;
        const fbMatch = content.match(fallbackRegex);
        if (fbMatch && !fbMatch[1].includes('<!-- OLD SIDEBAR')) {
            content = content.replace(fbMatch[1], `<!-- OLD SIDEBAR — DO NOT DELETE\n${fbMatch[1]}\n-->`);
        }
    }

    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
}
