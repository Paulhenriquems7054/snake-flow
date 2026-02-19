#!/usr/bin/env node
const JimpImport = require("jimp");
const Jimp = JimpImport.default || JimpImport;
const fs = require("fs");
const path = require("path");

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const publicRoot = path.join(repoRoot, "public");
  const candidates = [
    path.join(publicRoot, "1024.png"),
    path.join(publicRoot, "res", "mipmap-xxxhdpi", "ic_launcher.png"),
    path.join(publicRoot, "snake - Copia.png"),
    path.join(publicRoot, "snake.png"),
  ];

  let src = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      src = c;
      break;
    }
  }
  if (!src) {
    console.error("No source launcher image found. Expected one of:", candidates);
    process.exit(1);
  }

  console.log("Using source image:", src);

  const resBase = path.join(repoRoot, "android", "app", "src", "main", "res");

  // Standard Android launcher sizes (px)
  const mipmaps = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
  };

  // Adaptive / anydpi sizes - keep large so system can scale down
  const anydpiSize = 512;

  const image = await Jimp.read(src);

  // Ensure source is square by fitting into a square canvas preserving aspect ratio, centered on dark background
  const maxSide = Math.max(image.bitmap.width, image.bitmap.height);
  if (image.bitmap.width !== image.bitmap.height) {
    const square = new Jimp(maxSide, maxSide, 0x000000FF); // black background (with alpha)
    square.composite(image, Math.floor((maxSide - image.bitmap.width) / 2), Math.floor((maxSide - image.bitmap.height) / 2));
    image.resize(maxSide, maxSide);
    image.blit(square, 0, 0);
  }

  // Write mipmap PNGs
  for (const [dir, size] of Object.entries(mipmaps)) {
    const outDir = path.join(resBase, dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "ic_launcher.png");
    const outRound = path.join(outDir, "ic_launcher_round.png");
    const cloned = image.clone().resize(size, size, Jimp.RESIZE_BICUBIC);
    await cloned.quality(100).writeAsync(outPath);
    await cloned.quality(100).writeAsync(outRound);
    console.log(`Wrote ${outPath} (${size}x${size})`);
  }

  // anydpi adaptive foreground/background and foreground PNG
  const anyDir = path.join(resBase, "mipmap-anydpi-v26");
  if (!fs.existsSync(anyDir)) fs.mkdirSync(anyDir, { recursive: true });
  const forePath = path.join(anyDir, "ic_launcher_adaptive_fore.png");
  const backPath = path.join(anyDir, "ic_launcher_adaptive_back.png");
  const foreSimple = path.join(anyDir, "ic_launcher_foreground.png");
  const anyImg = image.clone().resize(anydpiSize, anydpiSize, Jimp.RESIZE_BICUBIC);
  await anyImg.quality(100).writeAsync(forePath);
  await anyImg.quality(100).writeAsync(backPath);
  await anyImg.quality(100).writeAsync(foreSimple);
  console.log(`Wrote adaptive images to ${anyDir}`);

  // Ensure mipmap root ic_launcher is present (use xxxhdpi)
  const srcXxx = path.join(resBase, "mipmap-xxxhdpi", "ic_launcher.png");
  const rootDest = path.join(resBase, "mipmap-anydpi-v26", "ic_launcher.png");
  try {
    fs.copyFileSync(srcXxx, rootDest);
    console.log(`Copied ${srcXxx} -> ${rootDest}`);
  } catch (e) {
    // ignore
  }

  console.log("Icon generation complete. Rebuild the Android project to apply changes.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

