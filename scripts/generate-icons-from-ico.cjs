const fs = require('fs');
const path = require('path');
const ico = require('icojs');

const projectRoot = path.resolve(__dirname, '..');
const srcIco = path.join(projectRoot, 'public', 'favicon.ico');
const fallbackPng = path.join(projectRoot, 'public', '1024.png');
if (!fs.existsSync(srcIco) && !fs.existsSync(fallbackPng)) {
  console.error('Nenhuma fonte de ícone encontrada. Esperado public/favicon.ico ou public/1024.png');
  process.exit(1);
}

async function generate() {
  try {
    const src = fs.existsSync(srcIco) ? srcIco : fallbackPng;
    const data = fs.readFileSync(src);

    // If source is ICO, parse entries; otherwise treat as single PNG buffer
    let entries = null;
    if (path.extname(src).toLowerCase() === '.ico') {
      entries = await ico.parse(data, 'image/png'); // returns array of { width, height, buffer }
    }

    const resDir = path.join(projectRoot, 'public', 'res');
    const mipmaps = {
      'mipmap-mdpi': 48,
      'mipmap-hdpi': 72,
      'mipmap-xhdpi': 96,
      'mipmap-xxhdpi': 144,
      'mipmap-xxxhdpi': 192,
    };

    await ensureDir(resDir);

    for (const [mipmap, size] of Object.entries(mipmaps)) {
      const dir = path.join(resDir, mipmap);
      await ensureDir(dir);
      const out = path.join(dir, 'ic_launcher.png');

      if (entries && entries.length) {
        // pick entry with width >= size, prefer smallest such, else pick largest
        let candidate = entries
          .slice()
          .sort((a, b) => a.width - b.width)
          .find(e => e.width >= size);
        if (!candidate) candidate = entries.slice().sort((a, b) => b.width - a.width)[0];
        fs.writeFileSync(out, Buffer.from(candidate.buffer));
        console.log('Created', out, `(from ICO ${candidate.width}x${candidate.height})`);
      } else {
        // fallback: copy src (PNG) to out
        fs.copyFileSync(src, out);
        console.log('Copied', src, '->', out);
      }
    }

    const anydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
    await ensureDir(anydpiDir);
    const adaptiveOut = path.join(anydpiDir, 'ic_launcher_adaptive_fore.png');
    const anydpiLauncher = path.join(anydpiDir, 'ic_launcher.png');

    if (entries && entries.length) {
      const largest = entries.slice().sort((a, b) => b.width - a.width)[0];
      fs.writeFileSync(adaptiveOut, Buffer.from(largest.buffer));
      fs.writeFileSync(anydpiLauncher, Buffer.from(largest.buffer));
      console.log('Created', adaptiveOut, anydpiLauncher, `(from ICO ${largest.width}x${largest.height})`);
    } else {
      fs.copyFileSync(src, adaptiveOut);
      fs.copyFileSync(src, anydpiLauncher);
      console.log('Copied', src, '->', adaptiveOut, anydpiLauncher);
    }

    console.log('Icon generation from ICO finished.');
  } catch (e) {
    console.error('Failed to generate icons from ICO:', e);
    process.exit(1);
  }
}

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

generate();

