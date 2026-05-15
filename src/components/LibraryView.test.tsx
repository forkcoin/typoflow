import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeHtmlItem } from "../test/htmlItemFixture";
import LibraryView from "./LibraryView";

describe("LibraryView", () => {
  it("shows items and filters favorites", async () => {
    const user = userEvent.setup();
    render(
      <LibraryView
        items={[makeHtmlItem({ id: "favorite", favorite: true }), makeHtmlItem({ id: "regular", title: "普通 HTML" })]}
        onOpen={() => {}}
        onImport={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getAllByRole("article")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: /打开筛选/i }));
    await user.click(screen.getByRole("button", { name: /收藏/i }));
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("paginates library items", async () => {
    const user = userEvent.setup();
    const items = Array.from({ length: 14 }, (_, index) => ({
      ...makeHtmlItem(),
      id: `sample-${index}`,
      title: `示例 ${index + 1}`,
    }));

    render(<LibraryView items={items} onOpen={() => {}} onImport={() => {}} onDelete={() => {}} />);

    expect(screen.getAllByRole("article")).toHaveLength(12);
    expect(screen.getByText("PAGE 1/2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /NEXT/i }));

    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByText("PAGE 2/2")).toBeInTheDocument();
  });

  it("confirms item deletion from a long press menu", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(<LibraryView items={[makeHtmlItem({ id: "delete-me", title: "待删除 HTML" })]} onOpen={() => {}} onImport={() => {}} onDelete={onDelete} />);

    fireEvent.contextMenu(screen.getByRole("article"));

    expect(screen.getByText("删除这篇 HTML？")).toBeInTheDocument();
    expect(screen.getByText("该项目会从书架中移除，原始文件不会被删除。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "删除" }));

    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "delete-me" }));
  });

  it("opens a folder and shows its html items", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    render(
      <LibraryView
        items={[
          makeHtmlItem({ id: "folder-item-1", title: "第一篇", folderName: "AI表达系列" }),
          makeHtmlItem({ id: "folder-item-2", title: "第二篇", folderName: "AI表达系列" }),
          makeHtmlItem({ id: "loose-item", title: "散落文章" }),
        ]}
        onOpen={onOpen}
        onImport={() => {}}
        onDelete={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "AI表达系列，2 篇" })).toBeInTheDocument();
    expect(screen.queryByText("第一篇")).not.toBeInTheDocument();
    expect(screen.getByText("散落文章")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "AI表达系列，2 篇" }));

    expect(screen.getByText("第一篇")).toBeInTheDocument();
    expect(screen.getByText("第二篇")).toBeInTheDocument();
    expect(screen.queryByText("散落文章")).not.toBeInTheDocument();

    await user.click(screen.getByText("第一篇"));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "folder-item-1" }));
  });
});
