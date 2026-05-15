import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const require = createRequire("/Users/42matrix/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/");
const { chromium } = require("playwright");

const outputDir = "/Users/42matrix/Desktop/text/outputs/yan-chu-fa-sui-text-film/screenshots";
const url = "http://127.0.0.1:8765/outputs/yan-chu-fa-sui-text-film/index.html";
const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

for (const viewport of viewports) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  });

  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({
    content: "*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;}",
  });

  const metrics = await page.evaluate(() => {
    const targets = [
      ...document.querySelectorAll("h1,h2,p,.chip,.chain__item,.receipt__row,.console__line,.final-mark"),
    ];
    const overflows = targets
      .filter((element) => element.scrollWidth > element.clientWidth + 1)
      .map((element) => ({
        text: element.textContent.trim().slice(0, 40),
        tag: element.tagName,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      }));

    return {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      scenes: document.querySelectorAll(".scene").length,
      pageScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      overflowCount: overflows.length,
      overflows: overflows.slice(0, 5),
    };
  });

  await page.screenshot({
    path: `${outputDir}/${viewport.name}.png`,
    fullPage: false,
  });

  results.push({ name: viewport.name, ...metrics });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
