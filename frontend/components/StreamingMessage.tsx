"use client";

import { useEffect, useRef, useState } from "react";
import type { KaelArtifact } from "./artifacts/artifactParser";
import ArtifactMessageBody from "./artifacts/ArtifactMessageBody";

const TARGET_DURATION_MS = 1_150;
const FRAME_MS = 32;

export default function StreamingMessage({
  content,
  enabled,
  onComplete,
  onOpenArtifact,
}: {
  content: string;
  enabled: boolean;
  onComplete: () => void;
  onOpenArtifact: (artifact: KaelArtifact) => void;
}) {
  const [visibleChars, setVisibleChars] = useState(
    enabled ? 0 : content.length,
  );
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!enabled || reducedMotion || content.length === 0) {
      setVisibleChars(content.length);
      completedRef.current = true;
      onCompleteRef.current();
      return undefined;
    }

    setVisibleChars(0);
    const total = content.length;
    const step = Math.max(1, Math.ceil(total / (TARGET_DURATION_MS / FRAME_MS)));
    let current = 0;

    const interval = window.setInterval(() => {
      current = Math.min(total, current + step);
      setVisibleChars(current);

      if (current >= total) {
        window.clearInterval(interval);
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current();
        }
      }
    }, FRAME_MS);

    return () => window.clearInterval(interval);
  }, [content, enabled]);

  const streaming = enabled && visibleChars < content.length;

  return (
    <div className={streaming ? "kael-streaming" : undefined}>
      <ArtifactMessageBody
        content={content.slice(0, visibleChars)}
        onOpenArtifact={onOpenArtifact}
        streaming={streaming}
      />
    </div>
  );
}
