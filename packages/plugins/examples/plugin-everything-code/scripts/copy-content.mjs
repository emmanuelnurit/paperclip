import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, "..");
const src = path.join(packageRoot, "src/content");
const dst = path.join(packageRoot, "dist/content");

async function copy(srcDir, dstDir) {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  await fs.mkdir(dstDir, { recursive: true });
  for (const entry of entries) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      await copy(s, d);
    } else if (entry.name.endsWith(".md") || entry.name.endsWith(".json")) {
      await fs.copyFile(s, d);
    }
  }
}

try {
  await copy(src, dst);
  console.log(`copied content from ${src} to ${dst}`);
} catch (err) {
  if (err && err.code === "ENOENT") {
    console.log("no content directory to copy");
  } else {
    throw err;
  }
}
