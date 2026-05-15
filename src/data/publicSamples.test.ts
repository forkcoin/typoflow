import { afterEach, describe, expect, it, vi } from "vitest";
import { loadPublicSampleItems } from "./publicSamples";

function makeResponse(body: string, contentType: string) {
  return new Response(body, {
    headers: {
      "content-type": contentType,
    },
  });
}

describe("loadPublicSampleItems", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("bundles public sample html with listed assets", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) => {
        const cleanPath = path.split("?")[0];
        if (cleanPath === "/samples/manifest.json") {
          return Promise.resolve(
            makeResponse(
              JSON.stringify([
                {
                  path: "/samples/demo/index.html",
                  assets: ["/samples/demo/style.css", "/samples/demo/assets/cover.png"],
                  title: "外部示例",
                },
              ]),
              "application/json",
            ),
          );
        }
        if (cleanPath === "/samples/demo/index.html") {
          return Promise.resolve(makeResponse('<html><head><link rel="stylesheet" href="style.css"></head><body></body></html>', "text/html"));
        }
        if (cleanPath === "/samples/demo/style.css") {
          return Promise.resolve(makeResponse("body{background:url(assets/cover.png)}", "text/css"));
        }
        if (cleanPath === "/samples/demo/assets/cover.png") {
          return Promise.resolve(makeResponse("fake image", "image/png"));
        }
        return Promise.resolve(new Response("", { status: 404 }));
      }),
    );

    const items = await loadPublicSampleItems();

    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("外部示例");
    expect(items[0].html).toContain("data:text/css");
    expect(decodeURIComponent(items[0].html)).toContain("data:image/png");
  });

  it("keeps the folder name from the public sample manifest", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((path: string) => {
        const cleanPath = path.split("?")[0];
        if (cleanPath === "/samples/manifest.json") {
          return Promise.resolve(
            makeResponse(
              JSON.stringify([
                {
                  path: "/samples/AI表达系列/01-demo.html",
                  folderName: "AI表达系列",
                },
              ]),
              "application/json",
            ),
          );
        }
        if (cleanPath === "/samples/AI表达系列/01-demo.html") {
          return Promise.resolve(makeResponse("<html><head><title>第一篇</title></head><body></body></html>", "text/html"));
        }
        return Promise.resolve(new Response("", { status: 404 }));
      }),
    );

    const items = await loadPublicSampleItems();

    expect(items[0].folderName).toBe("AI表达系列");
  });
});
