import type { HtmlItem } from "../types";

export function makeHtmlItem(patch: Partial<HtmlItem> = {}): HtmlItem {
  return {
    id: "fixture-item",
    title: "测试 HTML",
    summary: "测试用 HTML 文档。",
    html: "<!doctype html><html><head><title>测试 HTML</title></head><body><h1>测试 HTML</h1></body></html>",
    sourceType: "sample",
    tags: [],
    cover: "var(--cover-brief)",
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
    lastReadAt: null,
    readingProgress: 0,
    favorite: false,
    shareStatus: "private",
    shareSlug: "",
    ...patch,
  };
}
