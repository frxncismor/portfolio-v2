const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const publicDir = path.join(__dirname, '../public');
const pngFiles = [
  'ceeder.png',
  'contractors-project.png',
  'corporate-website.png',
  'crossyroad.png',
  'digital-invitation-platform.png',
  'kindnest.png',
  'room-tour.png',
  'shelfie.png',
  'vaneybr.png',
];

async function convertAll() {
  for (const file of pngFiles) {
    const input = path.join(publicDir, file);
    const output = path.join(publicDir, file.replace('.png', '.webp'));
    if (!fs.existsSync(input)) {
      console.warn(`Skipping ${file} — not found`);
      continue;
    }
    await sharp(input).webp({ quality: 87 }).toFile(output);
    const inSize = fs.statSync(input).size;
    const outSize = fs.statSync(output).size;
    console.log(`${file} → ${file.replace('.png', '.webp')} (${Math.round(inSize/1024)}kB → ${Math.round(outSize/1024)}kB)`);
  }
  console.log('Done.');
}

convertAll().catch(console.error);
