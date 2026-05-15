import { ChevronLeft } from "lucide-react";
import type { PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { HtmlItem } from "../types";
import { calculateProgress, shouldPersistProgress } from "../utils/progress";

interface ReaderViewProps {
  item: HtmlItem;
  onBack: () => void;
  onFavorite?: () => void;
  onProgress: (progress: number) => void;
}

export default function ReaderView({ item, onBack, onProgress }: ReaderViewProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const lastProgress = useRef(item.readingProgress);
  const swipeStart = useRef<{ x: number; y: number; side: "left" | "right" } | null>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [backVisible, setBackVisible] = useState(false);

  useEffect(() => {
    lastProgress.current = item.readingProgress;
  }, [item.id, item.readingProgress]);

  useEffect(() => {
    return () => {
      if (hideControlsTimer.current) {
        clearTimeout(hideControlsTimer.current);
      }
    };
  }, []);

  function persistProgress(next: number) {
    if (shouldPersistProgress(lastProgress.current, next)) {
      lastProgress.current = next;
      onProgress(next);
    }
  }

  function bindFrameProgress() {
    let frameWindow: Window | null | undefined;
    let frameDocument: Document | null | undefined;

    try {
      frameWindow = frameRef.current?.contentWindow;
      frameDocument = frameRef.current?.contentDocument;
    } catch {
      return;
    }

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

  function startSwipe(event: PointerEvent<HTMLDivElement>, side: "left" | "right") {
    swipeStart.current = { x: event.clientX, y: event.clientY, side };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function finishSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) {
      return;
    }

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const isHorizontalSwipe = Math.abs(deltaX) > 64 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4;
    const isBackSwipe = (start.side === "left" && deltaX > 0) || (start.side === "right" && deltaX < 0);
    if (isHorizontalSwipe && isBackSwipe) {
      onBack();
    }
  }

  function revealBackButton() {
    setBackVisible(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    hideControlsTimer.current = setTimeout(() => {
      setBackVisible(false);
      hideControlsTimer.current = null;
    }, 2000);
  }

  return (
    <section className="reader-screen">
      {!backVisible ? <button className="reader-hotspot" aria-label="显示返回按钮" onClick={revealBackButton} /> : null}
      {backVisible ? (
        <button className="reader-back-float" aria-label="返回书架" onClick={onBack}>
          <ChevronLeft size={18} />
        </button>
      ) : null}
      <div className="reader-frame-wrap">
        <iframe ref={frameRef} className="reader-frame" title="HTML document" sandbox="allow-scripts" srcDoc={item.html} onLoad={bindFrameProgress} />
      </div>
      <div
        className="reader-swipe-edge reader-swipe-edge-left"
        aria-hidden="true"
        onPointerDown={(event) => startSwipe(event, "left")}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
        onPointerUp={finishSwipe}
      />
      <div
        className="reader-swipe-edge reader-swipe-edge-right"
        aria-hidden="true"
        onPointerDown={(event) => startSwipe(event, "right")}
        onPointerCancel={() => {
          swipeStart.current = null;
        }}
        onPointerUp={finishSwipe}
      />
    </section>
  );
}
