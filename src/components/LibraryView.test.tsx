import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { sampleItems } from "../data/sampleItems";
import LibraryView from "./LibraryView";

describe("LibraryView", () => {
  it("shows items and filters favorites", async () => {
    const user = userEvent.setup();
    render(<LibraryView items={[{ ...sampleItems[0], favorite: true }, sampleItems[1]]} onOpen={() => {}} onImport={() => {}} />);
    expect(screen.getAllByRole("article")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: /favorites/i }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });
});
