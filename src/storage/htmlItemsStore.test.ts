import { beforeEach, describe, expect, it } from "vitest";
import { sampleItems } from "../data/sampleItems";
import { addItem, getItems, resetStoreForTests, seedSamples, updateItem } from "./htmlItemsStore";

describe("htmlItemsStore", () => {
  beforeEach(async () => {
    await resetStoreForTests();
  });

  it("seeds sample items once", async () => {
    await seedSamples();
    await seedSamples();
    const items = await getItems();
    expect(items).toHaveLength(sampleItems.length);
  });

  it("adds and updates imported items", async () => {
    await addItem({ ...sampleItems[0], id: "imported-1", sourceType: "paste", title: "Imported" });
    await updateItem("imported-1", { favorite: true, readingProgress: 62 });
    const item = (await getItems()).find((entry) => entry.id === "imported-1");
    expect(item?.favorite).toBe(true);
    expect(item?.readingProgress).toBe(62);
  });
});
