import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ImportDialog from "./ImportDialog";

describe("ImportDialog", () => {
  it("saves pasted html", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ImportDialog onClose={() => {}} onSave={onSave} />);
    await user.type(screen.getByLabelText(/paste html/i), "<html><head><title>Saved</title></head><body>Text</body></html>");
    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "Saved", sourceType: "paste" }));
  });
});
