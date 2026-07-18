import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const TARGET_DIRS = ["public/brand", "public/illustrations"];

async function optimizeDir(relativeDir) {
  const dir = path.join(ROOT, relativeDir);
  let entries;

  try {
    entries = await fs.readdir(dir);
  } catch {
    console.warn(`Skipping missing directory: ${relativeDir}`);
    return;
  }

  for (const file of entries) {
    if (!file.endsWith(".png")) continue;

    const input = path.join(dir, file);
    const output = path.join(dir, file.replace(/\.png$/i, ".webp"));
    const before = (await fs.stat(input)).size;

    await sharp(input).webp({ quality: 82, effort: 4 }).toFile(output);

    const after = (await fs.stat(output)).size;
    const saved = ((1 - after / before) * 100).toFixed(1);
    console.log(
      `${relativeDir}/${file} → .webp (${Math.round(before / 1024)}KB → ${Math.round(after / 1024)}KB, -${saved}%)`,
    );
  }
}

for (const dir of TARGET_DIRS) {
  await optimizeDir(dir);
}

console.log("Done.");
