import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ImportDialog from "./ImportDialog";

function makeFile(content: string, name: string, type: string, path?: string): File {
  const file = new File([content], name, { type });
  if (path) {
    Object.defineProperty(file, "webkitRelativePath", { value: path });
  }
  return file;
}

describe("ImportDialog", () => {
  it("saves pasted html", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ImportDialog onClose={() => {}} onSave={onSave} />);
    await user.type(screen.getByLabelText(/粘贴 HTML/i), "<html><head><title>Saved</title></head><body>Text</body></html>");
    await user.click(screen.getByRole("button", { name: /保存/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "Saved", sourceType: "paste" }));
  });

  it("saves a multi-file html package", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ImportDialog onClose={() => {}} onSave={onSave} />);

    await user.upload(screen.getByLabelText(/^上传文件$/i), [
      makeFile('<html><head><title>Pack</title></head><body><img src="assets/a.png"></body></html>', "index.html", "text/html", "site/index.html"),
      makeFile("fake image", "a.png", "image/png", "site/assets/a.png"),
    ]);

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "Pack", sourceType: "upload", html: expect.stringContaining("data:image/png") }));
  });

  it("keeps folder upload separate from normal file upload", () => {
    render(<ImportDialog onClose={() => {}} onSave={() => {}} />);

    expect(screen.getByLabelText(/^上传文件$/i)).not.toHaveAttribute("webkitdirectory");
    expect(screen.getByLabelText(/^上传文件夹$/i)).toHaveAttribute("webkitdirectory");
  });
});
