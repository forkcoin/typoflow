import { describe, expect, it } from "vitest";
import { bundleHtmlFiles } from "./htmlPackage";

function makeFile(content: string, name: string, type: string, path?: string): File {
  const file = new File([content], name, { type });
  if (path) {
    Object.defineProperty(file, "webkitRelativePath", { value: path });
  }
  return file;
}

describe("bundleHtmlFiles", () => {
  it("inlines sibling image assets referenced by html", async () => {
    const html = makeFile('<html><body><img src="./assets/cover.png"></body></html>', "index.html", "text/html", "site/index.html");
    const image = makeFile("fake image", "cover.png", "image/png", "site/assets/cover.png");
    const bundled = await bundleHtmlFiles([html, image]);

    expect(bundled).toContain("data:image/png");
    expect(bundled).not.toContain("./assets/cover.png");
  });

  it("inlines css files and css url assets", async () => {
    const html = makeFile('<html><head><link rel="stylesheet" href="style.css"></head><body></body></html>', "index.html", "text/html", "site/index.html");
    const css = makeFile("body{background:url(images/bg.png)}", "style.css", "text/css", "site/style.css");
    const image = makeFile("fake image", "bg.png", "image/png", "site/images/bg.png");
    const bundled = await bundleHtmlFiles([html, css, image]);

    expect(bundled).toContain("data:text/css");
    expect(decodeURIComponent(bundled)).toContain("data:image/png");
  });

  it("rejects imports without an html file", async () => {
    await expect(bundleHtmlFiles([makeFile("body{}", "style.css", "text/css")])).rejects.toThrow("请至少选择一个 HTML 文件。");
  });
});
