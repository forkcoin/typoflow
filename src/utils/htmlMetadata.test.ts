import { describe, expect, it } from "vitest";
import { createItemFromHtml } from "./htmlMetadata";

describe("createItemFromHtml", () => {
  it("extracts title and summary from html", () => {
    const item = createItemFromHtml(
      "<html><head><title>Quiet Layout</title></head><body><p>A calm reading test.</p></body></html>",
      "paste",
    );
    expect(item.title).toBe("Quiet Layout");
    expect(item.summary).toContain("A calm reading test");
    expect(item.shareStatus).toBe("private");
    expect(item.shareSlug).toBe("");
  });

  it("rejects empty html", () => {
    expect(() => createItemFromHtml("   ", "paste")).toThrow("HTML 内容是空的。");
  });
});
