import { Upload, X } from "lucide-react";
import { useState } from "react";
import type { HtmlItem } from "../types";
import { createItemFromHtml } from "../utils/htmlMetadata";

interface ImportDialogProps {
  onClose: () => void;
  onSave: (item: HtmlItem) => void | Promise<void>;
}

export default function ImportDialog({ onClose, onSave }: ImportDialogProps) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function savePastedHtml() {
    setError("");
    try {
      setBusy(true);
      await onSave(createItemFromHtml(html, "paste"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this HTML.");
    } finally {
      setBusy(false);
    }
  }

  async function importFile(file: File | undefined) {
    if (!file) {
      return;
    }
    setError("");
    try {
      setBusy(true);
      const text = await file.text();
      await onSave(createItemFromHtml(text, "upload"));
    } catch {
      setError("Could not read this file. Try another HTML file.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="import-dialog" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <header>
          <div>
            <p className="eyebrow">Import</p>
            <h2 id="import-title">Save HTML to your shelf</h2>
          </div>
          <button className="icon-button" aria-label="Close import" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <label className="paste-field">
          <span>Paste HTML</span>
          <textarea value={html} onChange={(event) => setHtml(event.target.value)} placeholder="Paste a complete HTML page or fragment" />
        </label>
        <div className="dialog-actions">
          <label className="secondary-button file-button">
            <Upload size={18} />
            Upload file
            <input accept=".html,.htm,text/html" type="file" onChange={(event) => void importFile(event.target.files?.[0])} />
          </label>
          <button className="primary-button" disabled={busy} onClick={() => void savePastedHtml()}>
            Save
          </button>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
      </section>
    </div>
  );
}
