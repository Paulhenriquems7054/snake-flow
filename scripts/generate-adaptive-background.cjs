const path = require("path");
const { Jimp } = require("jimp");

const ROOT = path.resolve(__dirname, "..");

// Adaptive icon layer sizes (px) per density: 108dp * density
const DENSITIES = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

async function main() {
  for (const [dir, size] of Object.entries(DENSITIES)) {
    const out = path.join(ROOT, "public", "res", dir, "ic_launcher_adaptive_back.png");
    const img = new Jimp({ width: size, height: size, color: 0x000000ff }); // solid black
    await img.write(out);
    console.log("Wrote", out, `${size}x${size}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

