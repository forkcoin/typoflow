import { useEffect, useRef } from "react";
import type { HtmlItem } from "../types";
import { calculateProgress, shouldPersistProgress } from "../utils/progress";
import TopBar from "./TopBar";

interface ReaderViewProps {
  item: HtmlItem;
  onBack: () => void;
  onFavorite: () => void;
  onProgress: (progress: number) => void;
}

export default function ReaderView({ item, onBack, onFavorite, onProgress }: ReaderViewProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const lastProgress = useRef(item.readingProgress);

  useEffect(() => {
    lastProgress.current = item.readingProgress;
  }, [item.id, item.readingProgress]);

  function persistProgress(next: number) {
    if (shouldPersistProgress(lastProgress.current, next)) {
      lastProgress.current = next;
      onProgress(next);
    }
  }

  function bindFrameProgress() {
    const frameWindow = frameRef.current?.contentWindow;
    const frameDocument = frameRef.current?.contentDocument;
    if (!frameWindow || !frameDocument) {
      return;
    }

    const updateProgress = () => {
      const scrollingElement = frameDocument.scrollingElement ?? frameDocument.documentElement;
      persistProgress(calculateProgress(scrollingElement.scrollTop, scrollingElement.scrollHeight, frameWindow.innerHeight));
    };

    frameWindow.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  return (
    <section className="reader-screen">
      <TopBar title={item.title} favorite={item.favorite} progress={item.readingProgress} onBack={onBack} onFavorite={onFavorite} />
      <div className="reader-frame-wrap">
        <iframe ref={frameRef} className="reader-frame" title="HTML document" sandbox="allow-same-origin" srcDoc={item.html} onLoad={bindFrameProgress} />
      </div>
    </section>
  );
}
