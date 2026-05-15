const HTML_FILE_PATTERN = /\.html?$/i;
const CSS_FILE_PATTERN = /\.css$/i;

interface ImportFile {
  name: string;
  type: string;
  webkitRelativePath?: string;
  text: () => Promise<string>;
}

interface AssetRecord {
  file: File;
  path: string;
}

function getFilePath(file: ImportFile): string {
  return normalizePath(file.webkitRelativePath || file.name);
}

function normalizePath(path: string): string {
  const cleanPath = decodeURI(path).replace(/\\/g, "/").replace(/^\.\/+/, "");
  const segments: string[] = [];

  cleanPath.split("/").forEach((segment: string) => {
    if (!segment || segment === ".") {
      return;
    }
    if (segment === "..") {
      segments.pop();
      return;
    }
    segments.push(segment);
  });

  return segments.join("/");
}

function dirname(path: string): string {
  const index = path.lastIndexOf("/");
  return index >= 0 ? path.slice(0, index + 1) : "";
}

function isExternalUrl(value: string): boolean {
  const trimmed = value.trim();
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(trimmed);
}

function splitUrl(value: string) {
  const hashIndex = value.indexOf("#");
  const queryIndex = value.indexOf("?");
  const indexes = [hashIndex, queryIndex].filter((index) => index >= 0);
  const suffixIndex = indexes.length ? Math.min(...indexes) : -1;

  if (suffixIndex < 0) {
    return { path: value, suffix: "" };
  }

  return { path: value.slice(0, suffixIndex), suffix: value.slice(suffixIndex) };
}

function findAsset(assetMap: Map<string, AssetRecord>, fromDir: string, rawValue: string): AssetRecord | undefined {
  if (!rawValue || isExternalUrl(rawValue)) {
    return undefined;
  }

  const { path } = splitUrl(rawValue);
  const candidates = [normalizePath(`${fromDir}${path}`), normalizePath(path), normalizePath(path.split("/").pop() ?? path)];
  return candidates.map((candidate) => assetMap.get(candidate)).find(Boolean);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("无法读取资源文件。"));
    reader.readAsDataURL(file);
  });
}

async function rewriteCssUrls(css: string, assetMap: Map<string, AssetRecord>, cssDir: string): Promise<string> {
  const matches = [...css.matchAll(/url\((['"]?)(.*?)\1\)/g)];
  let rewritten = css;

  for (const match of matches) {
    const rawUrl = match[2]?.trim();
    if (!rawUrl || isExternalUrl(rawUrl)) {
      continue;
    }

    const asset = findAsset(assetMap, cssDir, rawUrl);
    if (!asset) {
      continue;
    }

    const dataUrl = await readFileAsDataUrl(asset.file);
    rewritten = rewritten.replace(match[0], `url("${dataUrl}")`);
  }

  return rewritten;
}

async function fileToEmbeddableUrl(asset: AssetRecord, assetMap: Map<string, AssetRecord>): Promise<string> {
  if (CSS_FILE_PATTERN.test(asset.path)) {
    const css = await asset.file.text();
    const rewrittenCss = await rewriteCssUrls(css, assetMap, dirname(asset.path));
    return `data:text/css;charset=utf-8,${encodeURIComponent(rewrittenCss)}`;
  }

  return readFileAsDataUrl(asset.file);
}

async function rewriteElementUrl(element: Element, attribute: string, assetMap: Map<string, AssetRecord>, htmlDir: string) {
  const value = element.getAttribute(attribute);
  if (!value) {
    return;
  }

  const asset = findAsset(assetMap, htmlDir, value);
  if (!asset) {
    return;
  }

  element.setAttribute(attribute, await fileToEmbeddableUrl(asset, assetMap));
}

export async function bundleHtmlFiles(files: File[]): Promise<string> {
  const htmlFile = files.find((file) => HTML_FILE_PATTERN.test(getFilePath(file)) || file.type === "text/html");
  if (!htmlFile) {
    throw new Error("请至少选择一个 HTML 文件。");
  }

  const htmlPath = getFilePath(htmlFile);
  const htmlDir = dirname(htmlPath);
  const assets = files
    .filter((file) => file !== htmlFile)
    .map((file) => ({ file, path: getFilePath(file) }));

  if (!assets.length) {
    return htmlFile.text();
  }

  const assetMap = new Map<string, AssetRecord>();
  assets.forEach((asset) => {
    assetMap.set(asset.path, asset);
    assetMap.set(normalizePath(asset.path.replace(htmlDir, "")), asset);
    assetMap.set(asset.file.name, asset);
  });

  const parser = new DOMParser();
  const document = parser.parseFromString(await htmlFile.text(), "text/html");

  const urlAttributes = [
    ["src"],
    ["href"],
    ["poster"],
  ] as const;

  for (const [attribute] of urlAttributes) {
    const elements = [...document.querySelectorAll(`[${attribute}]`)];
    for (const element of elements) {
      await rewriteElementUrl(element, attribute, assetMap, htmlDir);
    }
  }

  for (const styleElement of [...document.querySelectorAll("style")]) {
    styleElement.textContent = await rewriteCssUrls(styleElement.textContent ?? "", assetMap, htmlDir);
  }

  for (const element of [...document.querySelectorAll("[style]")]) {
    const style = element.getAttribute("style");
    if (style) {
      element.setAttribute("style", await rewriteCssUrls(style, assetMap, htmlDir));
    }
  }

  return `<!doctype html>\n${document.documentElement.outerHTML}`;
}
