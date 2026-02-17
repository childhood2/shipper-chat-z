const fs = require("fs");
const path = require("path");

// Copy public/ and .next/static/ into .next/standalone/ for standalone output
// Next.js standalone doesn't copy these automatically

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const publicSrc = path.join(root, "public");
const staticSrc = path.join(root, ".next", "static");
const publicDest = path.join(standalone, "public");
const staticDest = path.join(standalone, ".next", "static");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Skipping ${src} (does not exist)`);
    return;
  }
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

console.log("Copying assets for standalone build...");
if (fs.existsSync(publicSrc)) {
  console.log(`Copying ${publicSrc} -> ${publicDest}`);
  copyRecursive(publicSrc, publicDest);
}
if (fs.existsSync(staticSrc)) {
  console.log(`Copying ${staticSrc} -> ${staticDest}`);
  copyRecursive(staticSrc, staticDest);
}
console.log("Done copying standalone assets.");
