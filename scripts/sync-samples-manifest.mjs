import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const samplesDir = path.resolve("public/samples");
const manifestPath = path.join(samplesDir, "manifest.json");
const ignoredNames = new Set(["manifest.json", ".DS_Store"]);
const ignoredDirectoryNames = new Set(["screenshots", "screenshots-svg", "__screenshots__", ".git"]);

function toPublicPath(filePath) {
  return `/${path.relative("public", filePath).split(path.sep).join("/")}`;
}

function isHtml(filePath) {
  return /\.html?$/i.test(filePath);
}

function makeManifestEntry(htmlPath, files, folderName) {
  const entry = {
    path: toPublicPath(htmlPath),
    assets: files.filter((filePath) => filePath !== htmlPath && !isHtml(filePath)).map(toPublicPath),
  };
  if (folderName) {
    entry.folderName = folderName;
  }
  return entry;
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredNames.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirectoryNames.has(entry.name)) {
        continue;
      }
      files.push(...(await listFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
}

export async function buildSampleManifest() {
  try {
    await stat(samplesDir);
  } catch {
    return [];
  }

  const rootEntries = await readdir(samplesDir, { withFileTypes: true });
  const manifest = [];

  for (const entry of rootEntries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (ignoredNames.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(samplesDir, entry.name);

    if (entry.isFile() && isHtml(fullPath)) {
      manifest.push({
        path: toPublicPath(fullPath),
        assets: [],
      });
      continue;
    }

    if (!entry.isDirectory()) {
      continue;
    }

    if (ignoredDirectoryNames.has(entry.name)) {
      continue;
    }

    const files = await listFiles(fullPath);
    const directIndexPath = path.join(fullPath, "index.html");
    if (files.includes(directIndexPath)) {
      manifest.push(makeManifestEntry(directIndexPath, files));
      continue;
    }

    const childEntries = await readdir(fullPath, { withFileTypes: true });
    const directHtmlPaths = childEntries
      .filter((child) => child.isFile() && !ignoredNames.has(child.name) && isHtml(child.name))
      .map((child) => path.join(fullPath, child.name));
    const sharedAssets = files.filter((filePath) => !isHtml(filePath));

    directHtmlPaths.forEach((htmlPath) => {
      manifest.push(makeManifestEntry(htmlPath, [htmlPath, ...sharedAssets], entry.name));
    });

    for (const child of childEntries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!child.isDirectory() || ignoredDirectoryNames.has(child.name)) {
        continue;
      }
      const childPath = path.join(fullPath, child.name);
      const childFiles = await listFiles(childPath);
      const childHtmlPath = childFiles.find((filePath) => path.basename(filePath).toLowerCase() === "index.html") ?? childFiles.find(isHtml);
      if (childHtmlPath) {
        manifest.push(makeManifestEntry(childHtmlPath, childFiles, entry.name));
      }
    }
  }

  return manifest;
}

export async function syncSamplesManifest() {
  const manifest = await buildSampleManifest();
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = await syncSamplesManifest();
  console.log(`Synced ${manifest.length} sample${manifest.length === 1 ? "" : "s"} to public/samples/manifest.json`);
}
