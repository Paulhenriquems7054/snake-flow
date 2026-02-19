const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const src = path.join(repoRoot, 'public', 'res', 'mipmap-hdpi', 'ic_launcher.png');
const resBase = path.join(repoRoot, 'android', 'app', 'src', 'main', 'res');

if (!fs.existsSync(src)) {
  console.error('Source icon not found:', src);
  process.exit(1);
}

const targets = [
  'mipmap-mdpi',
  'mipmap-hdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi',
];

for (const t of targets) {
  const dir = path.join(resBase, t);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, 'ic_launcher.png');
  fs.copyFileSync(src, dest);
  console.log('Copied to', dest);
  const destRound = path.join(dir, 'ic_launcher_round.png');
  fs.copyFileSync(src, destRound);
}

const anyDir = path.join(resBase, 'mipmap-anydpi-v26');
if (!fs.existsSync(anyDir)) fs.mkdirSync(anyDir, { recursive: true });
fs.copyFileSync(src, path.join(anyDir, 'ic_launcher_adaptive_fore.png'));
fs.copyFileSync(src, path.join(anyDir, 'ic_launcher_adaptive_back.png'));
fs.copyFileSync(src, path.join(anyDir, 'ic_launcher_foreground.png'));
fs.copyFileSync(path.join(resBase, 'mipmap-xxxhdpi', 'ic_launcher.png'), path.join(anyDir, 'ic_launcher.png'));

console.log('Exact icon copy complete.');

