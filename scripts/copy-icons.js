const fs = require('fs');
const path = require('path');

// Source icon (should exist): public/1024.png
const src = path.resolve(__dirname, '..', 'public', '1024.png');
if (!fs.existsSync(src)) {
  console.error('Source icon not found:', src);
  process.exit(1);
}

const resBase = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const mipmaps = [
  'mipmap-mdpi',
  'mipmap-hdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi',
  'mipmap-anydpi-v26'
];

for (const m of mipmaps) {
  const dir = path.join(resBase, m);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, 'ic_launcher.png');
  fs.copyFileSync(src, dest);
  console.log('Copied', src, '->', dest);
}

console.log('Icons copied. Now rebuild the Android project (assembleDebug) or run `npx cap copy` then rebuild.');
