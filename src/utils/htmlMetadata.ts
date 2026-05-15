import type { HtmlItem, HtmlSourceType } from "../types";

function makeSummary(document: Document): string {
  const text = (document.body?.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!text) {
    return "一篇已保存的 HTML 文档。";
  }
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

function makeLocalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `html-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createItemFromHtml(html: string, sourceType: HtmlSourceType): HtmlItem {
  if (!html.trim()) {
    throw new Error("HTML 内容是空的。");
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  const title = document.title.trim() || document.querySelector("h1")?.textContent?.trim() || "未命名 HTML";
  const now = new Date().toISOString();

  return {
    id: makeLocalId(),
    title,
    summary: makeSummary(document),
    html,
    sourceType,
    tags: [],
    cover: sourceType === "sample" ? "var(--cover-brief)" : sourceType === "paste" ? "var(--cover-paste)" : "var(--cover-upload)",
    createdAt: now,
    updatedAt: now,
    lastReadAt: null,
    readingProgress: 0,
    favorite: false,
    shareStatus: "private",
    shareSlug: "",
  };
}
