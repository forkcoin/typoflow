import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeHtmlItem } from "../test/htmlItemFixture";
import ReaderView from "./ReaderView";

describe("ReaderView", () => {
  const item = makeHtmlItem();

  it("keeps reader controls hidden until the invisible hotspot is tapped", async () => {
    const user = userEvent.setup();
    render(<ReaderView item={item} onBack={() => {}} onFavorite={() => {}} onProgress={() => {}} />);
    expect(screen.getByTitle("HTML document")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /返回书架/i })).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("显示返回按钮"));

    expect(screen.getByRole("button", { name: /返回书架/i })).toBeInTheDocument();
    expect(screen.queryByText(item.title)).not.toBeInTheDocument();
  });

  it("removes the invisible hotspot while the back button is visible", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<ReaderView item={item} onBack={onBack} onFavorite={() => {}} onProgress={() => {}} />);

    await user.click(screen.getByLabelText("显示返回按钮"));

    expect(screen.queryByLabelText("显示返回按钮")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /返回书架/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("auto-hides the minimal back button after a short delay", async () => {
    vi.useFakeTimers();
    render(<ReaderView item={item} onBack={() => {}} onFavorite={() => {}} onProgress={() => {}} />);

    fireEvent.click(screen.getByLabelText("显示返回按钮"));
    expect(screen.getByRole("button", { name: /返回书架/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(screen.queryByRole("button", { name: /返回书架/i })).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("returns to library from an edge swipe", () => {
    const onBack = vi.fn();
    const { container } = render(<ReaderView item={item} onBack={onBack} onFavorite={() => {}} onProgress={() => {}} />);
    const edge = container.querySelector(".reader-swipe-edge-left");

    edge?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 2, clientY: 120, pointerId: 1 }));
    edge?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 96, clientY: 128, pointerId: 1 }));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("ignores mostly vertical edge swipes", () => {
    const onBack = vi.fn();
    const { container } = render(<ReaderView item={item} onBack={onBack} onFavorite={() => {}} onProgress={() => {}} />);
    const edge = container.querySelector(".reader-swipe-edge-left");

    edge?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 2, clientY: 120, pointerId: 1 }));
    edge?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 40, clientY: 230, pointerId: 1 }));

    expect(onBack).not.toHaveBeenCalled();
  });
});
