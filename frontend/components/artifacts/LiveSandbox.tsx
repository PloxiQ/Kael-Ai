"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../lib/i18n";
import type { KaelArtifact } from "./artifactParser";
import { artifactText } from "./artifactText";
import { buildPreviewDocument } from "./previewDocument";

export default function LiveSandbox({
  artifact,
  device,
}: {
  artifact: KaelArtifact;
  device: "desktop" | "mobile";
}) {
  const { language } = useI18n();
  const text = artifactText(language);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const srcDoc = useMemo(() => buildPreviewDocument(artifact), [artifact]);
  const isMobileFrame = device === "mobile";

  useEffect(() => {
    setLoaded(false);
    setError(null);
  }, [artifact.content, artifact.id]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      const data = event.data as
        | { type?: string; message?: string }
        | null;

      if (data?.type === "kael-artifact-error") {
        setError(data.message || text.previewError);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [text.previewError]);

  return (
    <div className="relative flex h-full min-h-0 w-full items-stretch justify-center overflow-hidden bg-[#0A0A0A] p-0 sm:p-3">
      <div
        className={`relative flex h-full min-h-0 w-full flex-col overflow-hidden transition-[width,border-radius,box-shadow] duration-300 ease-out ${
          isMobileFrame
            ? "mx-auto w-[375px] max-w-full rounded-[26px] border border-[#262626] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)]"
            : "rounded-none border-0 sm:rounded-xl sm:border sm:border-[#262626]"
        }`}
      >
        <iframe
          ref={iframeRef}
          title={`${text.preview}: ${artifact.title || text.untitled}`}
          sandbox="allow-scripts allow-modals"
          srcDoc={srcDoc}
          onLoad={() => setLoaded(true)}
          className="h-full w-full border-0 bg-white"
        />

        <AnimatePresence>
          {!loaded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A]/90"
            >
              <span className="flex items-center gap-2 rounded-full border border-[#262626] bg-[#1C1C1C] px-4 py-2 text-sm text-zinc-400">
                <Loader2
                  size={16}
                  className="animate-spin text-[#34D399]"
                />
                {text.loading}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute inset-x-3 bottom-3 flex items-start gap-3 rounded-xl border border-red-500/25 bg-[#1a070b]/95 px-4 py-3 text-sm text-red-200 shadow-xl backdrop-blur-xl"
            >
              <TriangleAlert
                size={18}
                className="mt-0.5 shrink-0 text-red-300"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-red-200">
                  {text.previewError}
                </p>
                <p className="mt-1 break-words text-red-200/75">
                  {error}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                aria-label={text.dismiss}
                className="rounded-lg p-1.5 text-red-200/70 transition hover:bg-[#1C1C1C] hover:text-white"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
