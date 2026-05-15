import type { HtmlItem } from "../types";
import { createItemFromHtml } from "../utils/htmlMetadata";
import { bundleHtmlFiles } from "../utils/htmlPackage";

interface PublicSampleManifestEntry {
  path: string;
  assets?: string[];
  title?: string;
  summary?: string;
  tags?: string[];
  cover?: string;
  folderName?: string;
}

function makePublicSampleId(path: string): string {
  return `public-sample-${path.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`;
}

function pathToFileName(path: string): string {
  return path.split(/[?#]/)[0].split("/").filter(Boolean).pop() || "sample.html";
}

function pathForBundler(path: string): string {
  return path.split(/[?#]/)[0].replace(/^\/+/, "");
}

function cacheBustedPath(path: string, version: string): string {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}v=${encodeURIComponent(version)}`;
}

function publicPath(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

async function fetchFile(path: string, version: string): Promise<File> {
  const response = await fetch(cacheBustedPath(publicPath(path), version), { cache: "reload" });
  if (!response.ok) {
    throw new Error(`无法读取示例文件：${path}`);
  }

  const blob = await response.blob();
  const file = new File([blob], pathToFileName(path), { type: response.headers.get("content-type") ?? blob.type });
  Object.defineProperty(file, "webkitRelativePath", { value: pathForBundler(path) });
  return file;
}

async function bundlePublicSample(entry: PublicSampleManifestEntry, version: string): Promise<string> {
  const paths = [entry.path, ...(entry.assets ?? [])];
  const files = await Promise.all(paths.map((path) => fetchFile(path, version)));
  return bundleHtmlFiles(files);
}

export async function loadPublicSampleItems(): Promise<HtmlItem[]> {
  if (typeof fetch === "undefined") {
    return [];
  }

  try {
    const version = Date.now().toString(36);
    const manifestResponse = await fetch(cacheBustedPath(publicPath("/samples/manifest.json"), version), { cache: "reload" });
    if (!manifestResponse.ok) {
      return [];
    }

    const manifest = (await manifestResponse.json()) as PublicSampleManifestEntry[];
    const entries = Array.isArray(manifest) ? manifest : [];

    return Promise.all(
      entries.map(async (entry) => {
        const html = await bundlePublicSample(entry, version);
        const item = createItemFromHtml(html, "sample");
        return {
          ...item,
          id: makePublicSampleId(entry.path),
          title: entry.title?.trim() || item.title,
          summary: entry.summary?.trim() || item.summary,
          tags: entry.tags ?? item.tags,
          folderName: entry.folderName?.trim() || undefined,
          cover: entry.cover ?? "var(--cover-upload)",
        };
      }),
    );
  } catch {
    return [];
  }
}
