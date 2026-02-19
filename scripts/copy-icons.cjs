const fs = require('fs');
const path = require('path');

// Prefer explicit platform icons if available, else fallback to public/1024.png
// Also accept legacy exported logo files like "snake - Copia.png" or "snake.png" in project root.
const preferredLauncher = path.resolve(__dirname, '..', 'public', 'res', 'mipmap-xxxhdpi', 'ic_launcher.png');
const preferredLauncher2 = path.resolve(__dirname, '..', 'public', 'res', 'mipmap-xxhdpi', 'ic_launcher.png');
const preferredLauncher3 = path.resolve(__dirname, '..', 'public', 'res', 'mipmap-xhdpi', 'ic_launcher.png');
const altLauncher1 = path.resolve(__dirname, '..', 'public', 'snake - Copia.png');
const altLauncher2 = path.resolve(__dirname, '..', 'public', 'snake.png');
const adaptiveXmlAny = path.resolve(__dirname, '..', 'public', 'res', 'mipmap-anydpi-v26', 'ic_launcher.xml');
const fallback1024 = path.resolve(__dirname, '..', 'public', '1024.png');

let launcherSrc = null;
if (fs.existsSync(preferredLauncher)) launcherSrc = preferredLauncher;
else if (fs.existsSync(preferredLauncher2)) launcherSrc = preferredLauncher2;
else if (fs.existsSync(preferredLauncher3)) launcherSrc = preferredLauncher3;
else if (fs.existsSync(altLauncher1)) launcherSrc = altLauncher1;
else if (fs.existsSync(altLauncher2)) launcherSrc = altLauncher2;
else if (fs.existsSync(fallback1024)) launcherSrc = fallback1024;
else {
  console.error('No launcher source found. Expected one of:', preferredLauncher, fallback1024);
  process.exit(1);
}

const adaptiveXmlSrc = fs.existsSync(adaptiveXmlAny) ? adaptiveXmlAny : null;

const resBase = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const publicResBase = path.resolve(__dirname, '..', 'public', 'res');
const mipmaps = [
  'mipmap-mdpi',
  'mipmap-hdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi'
];

for (const m of mipmaps) {
  const dir = path.join(resBase, m);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const perDensitySrc = path.join(publicResBase, m, 'ic_launcher.png');
  const launcherForDensity = fs.existsSync(perDensitySrc) ? perDensitySrc : launcherSrc;
  const destLauncher = path.join(dir, 'ic_launcher.png');
  fs.copyFileSync(launcherForDensity, destLauncher);
  console.log('Copied', launcherForDensity, '->', destLauncher);

  // Keep round icon consistent (if you want a different round crop, generate it separately)
  const destRound = path.join(dir, 'ic_launcher_round.png');
  fs.copyFileSync(launcherForDensity, destRound);
  console.log('Copied', launcherForDensity, '->', destRound);

  // Adaptive icon layers should be density-specific (mdpi..xxxhdpi).
  // Do NOT place adaptive PNGs inside mipmap-anydpi-v26 because -v26 wins on API 26+ and will be scaled (blurry).
  const perBack = path.join(publicResBase, m, 'ic_launcher_adaptive_back.png');
  const perFore = path.join(publicResBase, m, 'ic_launcher_adaptive_fore.png');
  if (fs.existsSync(perBack)) {
    const destBack = path.join(dir, 'ic_launcher_adaptive_back.png');
    fs.copyFileSync(perBack, destBack);
    console.log('Copied', perBack, '->', destBack);
  }
  if (fs.existsSync(perFore)) {
    const destFore = path.join(dir, 'ic_launcher_adaptive_fore.png');
    fs.copyFileSync(perFore, destFore);
    console.log('Copied', perFore, '->', destFore);
  }
}

// For adaptive icon (Android 8+), copy background/foreground + XML into mipmap-anydpi-v26
const anydpiDir = path.join(resBase, 'mipmap-anydpi-v26');
if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });

// XML (adaptive icon) — this is what makes @mipmap/ic_launcher work on API 26+
if (adaptiveXmlSrc) {
  const xmlDest = path.join(anydpiDir, 'ic_launcher.xml');
  fs.copyFileSync(adaptiveXmlSrc, xmlDest);
  console.log('Copied', adaptiveXmlSrc, '->', xmlDest);
} else {
  console.warn('No adaptive icon XML found at', adaptiveXmlAny, '(keeping existing android mipmap-anydpi-v26/ic_launcher.xml)');
}

console.log('Icons copied. Now rebuild the Android project (assembleDebug) or run `npx cap copy` then rebuild.');

