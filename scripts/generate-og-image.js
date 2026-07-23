import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const width = 1200;
const height = 630;
const primaryColor = '#3b82f6';

const svgImage = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="100%" height="100%" fill="#111827"/>
  <!-- Decorative Elements -->
  <circle cx="0" cy="0" r="400" fill="${primaryColor}" opacity="0.1"/>
  <circle cx="1200" cy="630" r="300" fill="${primaryColor}" opacity="0.1"/>
  <!-- Brand Text -->
  <g transform="translate(100, 280)">
    <path d="M0 24 L24 6 L48 24 L48 54 A5 5 0 0 1 43 59 L5 59 A5 5 0 0 1 0 54 Z" fill="${primaryColor}"/>
    <text x="70" y="45" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#ffffff">
      Intex<tspan fill="${primaryColor}">tify</tspan>
    </text>
  </g>
  <!-- Tagline -->
  <text x="100" y="380" font-family="Arial, sans-serif" font-size="32" fill="#9ca3af">
    Construction Calculators Pakistan
  </text>
</svg>
`;

async function generate() {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, 'og-banner.png');
  await sharp(Buffer.from(svgImage))
    .png()
    .toFile(outputPath);
  
  console.log('OG banner generated successfully at ' + outputPath);
}

generate().catch(console.error);
