const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const srcIco = path.join(projectRoot, 'public', 'favicon.ico');
const fallbackPng = path.join(projectRoot, 'public', '1024.png');
if (!fs.existsSync(srcIco) && !fs.existsSync(fallbackPng)) {
  console.error('Nenhuma fonte de ícone encontrada. Esperado public/favicon.ico ou public/1024.png');
  process.exit(1);
}

const src = fs.existsSync(srcIco) ? srcIco : fallbackPng;

const resDir = path.join(projectRoot, 'public', 'res');
const mipmaps = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function generate() {
  try {
    for (const [mipmap, size] of Object.entries(mipmaps)) {
      const dir = path.join(resDir, mipmap);
      await ensureDir(dir);
      const out = path.join(dir, 'ic_launcher.png');
      await sharp(src)
        .resize(size, size, { fit: 'cover' })
        .png()
        .toFile(out);
      console.log('Created', out);
    }

    // adaptive foreground recommended larger size (use 432 -> scales well)
    const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
    await ensureDir(anydpiDir);
    const adaptiveOut = path.join(anydpiDir, 'ic_launcher_adaptive_fore.png');
    await sharp(src)
      .resize(432, 432, { fit: 'cover' })
      .png()
      .toFile(adaptiveOut);
    console.log('Created', adaptiveOut);

    // Also put a launcher png into mipmap-anydpi-v26 to avoid installer issues
    const anydpiLauncher = path.join(anydpiDir, 'ic_launcher.png');
    await sharp(src)
      .resize(192, 192, { fit: 'cover' })
      .png()
      .toFile(anydpiLauncher);
    console.log('Created', anydpiLauncher);

    console.log('Icon generation finished.');
  } catch (e) {
    console.error('Failed to generate icons:', e);
    process.exit(1);
  }
}

generate();

