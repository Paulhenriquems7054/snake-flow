const fs = require('fs');
const path = require('path');

const resBase = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const mipmaps = [
  'mipmap-anydpi-v26',
  'mipmap-mdpi',
  'mipmap-hdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi',
];

for (const m of mipmaps) {
  const src = path.join(resBase, m, 'ic_launcher.png');
  const dest = path.join(resBase, m, 'ic_launcher_round.png');
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, dest);
      console.log('Copied', src, '->', dest);
    } catch (e) {
      console.error('Failed to copy', src, '->', dest, e);
    }
  } else {
    console.log('Source not found, skipping:', src);
  }
}

