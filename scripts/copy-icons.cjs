const fs = require('fs');
const path = require('path');

// Prefer explicit platform icons if available, else fallback to public/1024.png
const preferredLauncher = path.resolve(__dirname, '..', 'public', 'res', 'mipmap-xhdpi', 'ic_launcher.png');
const adaptiveForeHdpi = path.resolve(__dirname, '..', 'public', 'res', 'mipmap-hdpi', 'ic_launcher_adaptive_fore.png');
const adaptiveForeAny = path.resolve(__dirname, '..', 'public', 'res', 'mipmap-anydpi-v26', 'ic_launcher_adaptive_fore.png');
const fallback1024 = path.resolve(__dirname, '..', 'public', '1024.png');

let launcherSrc = null;
if (fs.existsSync(preferredLauncher)) launcherSrc = preferredLauncher;
else if (fs.existsSync(fallback1024)) launcherSrc = fallback1024;
else {
  console.error('No launcher source found. Expected one of:', preferredLauncher, fallback1024);
  process.exit(1);
}

let adaptiveSrc = null;
if (fs.existsSync(adaptiveForeHdpi)) adaptiveSrc = adaptiveForeHdpi;
else if (fs.existsSync(adaptiveForeAny)) adaptiveSrc = adaptiveForeAny;
else adaptiveSrc = launcherSrc;

const resBase = path.resolve(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
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
  const dest = path.join(dir, 'ic_launcher.png');
  fs.copyFileSync(launcherSrc, dest);
  console.log('Copied', launcherSrc, '->', dest);
}

// For adaptive icon foreground, place the adaptiveSrc image as ic_launcher_foreground in mipmap-anydpi-v26
const anydpiDir = path.join(resBase, 'mipmap-anydpi-v26');
if (!fs.existsSync(anydpiDir)) fs.mkdirSync(anydpiDir, { recursive: true });
const anydpiDest = path.join(anydpiDir, 'ic_launcher_foreground.png');
fs.copyFileSync(adaptiveSrc, anydpiDest);
console.log('Copied', adaptiveSrc, '->', anydpiDest);
// Also place a pre-composed ic_launcher.png in mipmap-anydpi-v26 to avoid installer issues
const anydpiLauncherDest = path.join(anydpiDir, 'ic_launcher.png');
fs.copyFileSync(launcherSrc, anydpiLauncherDest);
console.log('Copied', launcherSrc, '->', anydpiLauncherDest);

console.log('Icons copied. Now rebuild the Android project (assembleDebug) or run `npx cap copy` then rebuild.');

