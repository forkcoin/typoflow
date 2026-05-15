import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleItems } from "../data/sampleItems";
import { makeHtmlItem } from "../test/htmlItemFixture";
import type { HtmlItem } from "../types";
import { addItem, deleteLibraryItem, getItems, resetStoreForTests, seedSamples, updateItem } from "./htmlItemsStore";

let publicSamples: HtmlItem[] = [];

vi.mock("../data/publicSamples", () => ({
  loadPublicSampleItems: () => Promise.resolve(publicSamples),
}));

describe("htmlItemsStore", () => {
  beforeEach(async () => {
    publicSamples = [];
    await resetStoreForTests();
  });

  it("seeds sample items once", async () => {
    await seedSamples();
    await seedSamples();
    const items = await getItems();
    expect(items).toHaveLength(sampleItems.length);
  });

  it("adds and updates imported items", async () => {
    await addItem(makeHtmlItem({ id: "imported-1", sourceType: "paste", title: "Imported" }));
    await updateItem("imported-1", { favorite: true, readingProgress: 62 });
    const item = (await getItems()).find((entry) => entry.id === "imported-1");
    expect(item?.favorite).toBe(true);
    expect(item?.readingProgress).toBe(62);
  });

  it("removes public samples that no longer exist", async () => {
    const staleSample = makeHtmlItem({ id: "public-sample-old", title: "Old public sample" });
    publicSamples = [makeHtmlItem({ id: "public-sample-current", title: "Current public sample" })];
    await addItem(staleSample);

    await seedSamples();

    const items = await getItems();
    expect(items.some((item) => item.id === "public-sample-old")).toBe(false);
    expect(items.some((item) => item.id === "public-sample-current")).toBe(true);
  });

  it("removes retired built-in samples from existing libraries", async () => {
    await addItem(makeHtmlItem({ id: "sample-night-notes", title: "夜间札记" }));

    await seedSamples();

    const items = await getItems();
    expect(items.some((item) => item.id === "sample-night-notes")).toBe(false);
  });

  it("refreshes public sample html while preserving reading state", async () => {
    publicSamples = [makeHtmlItem({ id: "public-sample-current", title: "Version 1", html: "<html>one</html>" })];
    await seedSamples();
    await updateItem("public-sample-current", { favorite: true, readingProgress: 42 });

    publicSamples = [makeHtmlItem({ id: "public-sample-current", title: "Version 2", html: "<html>two</html>" })];
    await seedSamples();

    const item = (await getItems()).find((entry) => entry.id === "public-sample-current");
    expect(item?.title).toBe("Version 2");
    expect(item?.html).toBe("<html>two</html>");
    expect(item?.favorite).toBe(true);
    expect(item?.readingProgress).toBe(42);
  });

  it("keeps deleted public samples hidden after reseeding", async () => {
    publicSamples = [makeHtmlItem({ id: "public-sample-demo", title: "Public sample" })];
    await seedSamples();

    await deleteLibraryItem("public-sample-demo");
    await seedSamples();

    const items = await getItems();
    expect(items.some((item) => item.id === "public-sample-demo")).toBe(false);
  });
});
