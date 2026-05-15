import { describe, expect, it } from "vitest";
import { sampleItems } from "./sampleItems";

describe("sampleItems", () => {
  it("does not ship the old built-in examples", () => {
    expect(sampleItems).toHaveLength(0);
  });
});
