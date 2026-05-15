import { Upload, X } from "lucide-react";
import { useState } from "react";
import type { HtmlItem } from "../types";
import { createItemFromHtml } from "../utils/htmlMetadata";
import { bundleHtmlFiles } from "../utils/htmlPackage";

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
      setError(caught instanceof Error ? caught.message : "无法保存这段 HTML。");
    } finally {
      setBusy(false);
    }
  }

  async function importFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (!files.length) {
      return;
    }
    setError("");
    try {
      setBusy(true);
      const text = await bundleHtmlFiles(files);
      await onSave(createItemFromHtml(text, "upload"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "无法读取这个文件，请换一个 HTML 文件再试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="import-dialog" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <header>
          <div>
            <p className="eyebrow">导入</p>
            <h2 id="import-title">保存 HTML 到书架</h2>
          </div>
          <button className="icon-button" aria-label="关闭导入窗口" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <label className="paste-field">
          <span>粘贴 HTML</span>
          <textarea value={html} onChange={(event) => setHtml(event.target.value)} placeholder="粘贴完整 HTML 页面或片段" />
        </label>
        <p className="import-hint">如果 HTML 旁边还有图片或 CSS，请一次性多选这些文件；电脑浏览器也可以直接选择整个文件夹。</p>
        <div className="dialog-actions">
          <label className="secondary-button file-button">
            <Upload size={18} />
            上传文件
            <input type="file" multiple onChange={(event) => void importFiles(event.target.files)} />
          </label>
          <label className="secondary-button file-button desktop-file-button">
            <Upload size={18} />
            上传文件夹
            <input type="file" multiple onChange={(event) => void importFiles(event.target.files)} {...{ webkitdirectory: "" }} />
          </label>
          <button className="primary-button" disabled={busy} onClick={() => void savePastedHtml()}>
            保存
          </button>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
      </section>
    </div>
  );
}
