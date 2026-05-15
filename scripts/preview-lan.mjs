import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import path from "node:path";
import { buildSampleManifest } from "./sync-samples-manifest.mjs";

const port = Number(process.env.PORT || 4173);
const host = "0.0.0.0";
const distDir = path.resolve("dist");
const publicDir = path.resolve("public");
const samplesDir = path.join(publicDir, "samples");

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
]);

function contentType(filePath) {
  return mimeTypes.get(path.extname(filePath).toLowerCase()) || "application/octet-stream";
}

function send(req, res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(req.method === "HEAD" ? undefined : body);
}

function resolveInside(root, requestPath) {
  const decodedPath = decodeURIComponent(requestPath.split("?")[0]);
  const relativePath = decodedPath.replace(/^\/+/, "");
  const fullPath = path.resolve(root, relativePath);
  return fullPath === root || fullPath.startsWith(`${root}${path.sep}`) ? fullPath : null;
}

async function serveFile(req, res, filePath) {
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) {
    return false;
  }

  res.writeHead(200, {
    "cache-control": "no-cache",
    "content-length": fileStat.size,
    "content-type": contentType(filePath),
  });
  if (req.method === "HEAD") {
    res.end();
  } else {
    createReadStream(filePath).pipe(res);
  }
  return true;
}

async function serveStatic(req, res, root, requestPath) {
  const filePath = resolveInside(root, requestPath);
  if (!filePath) {
    send(req, res, 403, "Forbidden");
    return true;
  }

  try {
    return await serveFile(req, res, filePath);
  } catch {
    return false;
  }
}

function getNetworkUrls() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((entry) => entry && entry.family === "IPv4" && !entry.internal)
    .map((entry) => `http://${entry.address}:${port}/`);
}

const server = createServer(async (req, res) => {
  if (!req.url || (req.method !== "GET" && req.method !== "HEAD")) {
    send(req, res, 405, "Method Not Allowed");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || `localhost:${port}`}`);
  const pathname = url.pathname;

  if (pathname === "/samples/manifest.json") {
    const manifest = await buildSampleManifest();
    send(req, res, 200, `${JSON.stringify(manifest, null, 2)}\n`, {
      "cache-control": "no-cache",
      "content-type": "application/json; charset=utf-8",
    });
    return;
  }

  if (pathname.startsWith("/samples/")) {
    const served = await serveStatic(req, res, samplesDir, pathname.replace(/^\/samples\/?/, "/"));
    if (!served) {
      send(req, res, 404, "Not Found");
    }
    return;
  }

  const requestPath = pathname === "/" ? "/index.html" : pathname;
  const served = await serveStatic(req, res, distDir, requestPath);
  if (served) {
    return;
  }

  await serveStatic(req, res, distDir, "/index.html");
});

server.listen(port, host, () => {
  console.log(`  Local:   http://localhost:${port}/`);
  for (const url of getNetworkUrls()) {
    console.log(`  Network: ${url}`);
  }
});
