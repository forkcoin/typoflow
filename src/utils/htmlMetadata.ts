import type { HtmlItem, HtmlSourceType } from "../types";

function makeSummary(document: Document): string {
  const text = (document.body?.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!text) {
    return "A saved HTML document.";
  }
  return text.length > 140 ? `${text.slice(0, 137)}...` : text;
}

export function createItemFromHtml(html: string, sourceType: Exclude<HtmlSourceType, "sample">): HtmlItem {
  if (!html.trim()) {
    throw new Error("HTML content is empty.");
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  const title = document.title.trim() || document.querySelector("h1")?.textContent?.trim() || "Untitled HTML";
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title,
    summary: makeSummary(document),
    html,
    sourceType,
    tags: [],
    cover: sourceType === "paste" ? "#e7d8c9" : "#dfe7df",
    createdAt: now,
    updatedAt: now,
    lastReadAt: null,
    readingProgress: 0,
    favorite: false,
    shareStatus: "private",
    shareSlug: "",
  };
}
