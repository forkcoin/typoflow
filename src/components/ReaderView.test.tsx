import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sampleItems } from "../data/sampleItems";
import ReaderView from "./ReaderView";

describe("ReaderView", () => {
  it("renders html in a document frame and toggles favorite", async () => {
    const user = userEvent.setup();
    const onFavorite = vi.fn();
    render(<ReaderView item={sampleItems[0]} onBack={() => {}} onFavorite={onFavorite} onProgress={() => {}} />);
    expect(screen.getByTitle("HTML document")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /favorite/i }));
    expect(onFavorite).toHaveBeenCalled();
  });
});
