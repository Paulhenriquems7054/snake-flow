#!/usr/bin/env node
const sharp = require("sharp");
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
  const mipmaps = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
  };

  const anydpiSize = 512;

  for (const [dir, size] of Object.entries(mipmaps)) {
    const outDir = path.join(resBase, dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "ic_launcher.png");
    const outRound = path.join(outDir, "ic_launcher_round.png");
    await sharp(src)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png()
      .toFile(outPath);
    await sharp(src)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
      .png()
      .toFile(outRound);
    console.log(`Wrote ${outPath} (${size}x${size})`);
  }

  const anyDir = path.join(resBase, "mipmap-anydpi-v26");
  if (!fs.existsSync(anyDir)) fs.mkdirSync(anyDir, { recursive: true });
  const forePath = path.join(anyDir, "ic_launcher_adaptive_fore.png");
  const backPath = path.join(anyDir, "ic_launcher_adaptive_back.png");
  const foreSimple = path.join(anyDir, "ic_launcher_foreground.png");
  await sharp(src).resize(anydpiSize, anydpiSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } }).png().toFile(forePath);
  await sharp(src).resize(anydpiSize, anydpiSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } }).png().toFile(backPath);
  await sharp(src).resize(anydpiSize, anydpiSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } }).png().toFile(foreSimple);
  console.log(`Wrote adaptive images to ${anyDir}`);

  const srcXxx = path.join(resBase, "mipmap-xxxhdpi", "ic_launcher.png");
  const rootDest = path.join(resBase, "mipmap-anydpi-v26", "ic_launcher.png");
  try {
    fs.copyFileSync(srcXxx, rootDest);
    console.log(`Copied ${srcXxx} -> ${rootDest}`);
  } catch (e) {}

  console.log("Icon generation complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

