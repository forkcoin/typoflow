import { describe, expect, it } from "vitest";
import { sampleItems } from "./sampleItems";

describe("sampleItems", () => {
  it("ships at least three private sample items", () => {
    expect(sampleItems.length).toBeGreaterThanOrEqual(3);
    expect(sampleItems.every((item) => item.sourceType === "sample")).toBe(true);
    expect(sampleItems.every((item) => item.shareStatus === "private")).toBe(true);
    expect(sampleItems.every((item) => item.html.includes("<"))).toBe(true);
  });
});
