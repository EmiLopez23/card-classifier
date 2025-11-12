import { PSACard } from "@/lib/schemas";
import { useEffect, useMemo, useState } from "react";
import { analyzeCard } from "@/lib/api";

export const useCardAnalyzer = () => {
  type QueueItem = {
    id: string;
    file: File;
    fileName: string;
    status: "pending" | "processing" | "done" | "error";
    result: PSACard | null;
    error: string | null;
    retryCount: number;
  };

  const [items, setItems] = useState<QueueItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const hasPending = useMemo(
    () => items.some((it) => it.status === "pending"),
    [items]
  );

  const MAX_RETRIES = 2;

  const isTransientError = (error: unknown) => {
    const message =
      error instanceof Error ? error.message : String(error ?? "");
    const lower = message.toLowerCase();
    return (
      lower.includes("overloaded") ||
      lower.includes("temporarily unavailable") ||
      lower.includes("unavailable") ||
      lower.includes("503") ||
      lower.includes("rate limit") ||
      lower.includes("timeout")
    );
  };

  useEffect(() => {
    if (isAnalyzing) return;
    const nextIndex = items.findIndex((it) => it.status === "pending");
    if (nextIndex === -1) return;

    const nextItem = items[nextIndex];
    const run = async () => {
      setIsAnalyzing(true);
      setItems((prev) =>
        prev.map((it, idx) =>
          idx === nextIndex ? { ...it, status: "processing" } : it
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", nextItem.file);
        const response = await analyzeCard(formData);
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === nextIndex
              ? { ...it, status: "done", result: response, error: null }
              : it
          )
        );
      } catch (err) {
        if (isTransientError(err) && nextItem.retryCount < MAX_RETRIES) {
          const delayMs = 1000 * Math.pow(2, nextItem.retryCount); // 1s, 2s
          setItems((prev) =>
            prev.map((it, idx) =>
              idx === nextIndex
                ? {
                    ...it,
                    status: "pending",
                    error: null,
                    result: null,
                    retryCount: it.retryCount + 1,
                  }
                : it
            )
          );
          // Allow some delay before the effect picks up the next pending
          await new Promise((r) => setTimeout(r, delayMs));
        } else {
          const message =
            err instanceof Error ? err.message : "Unknown analysis error";
          setItems((prev) =>
            prev.map((it, idx) =>
              idx === nextIndex
                ? { ...it, status: "error", error: message, result: null }
                : it
            )
          );
        }
      } finally {
        setIsAnalyzing(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, isAnalyzing]);

  const enqueue = (files: File[]) => {
    if (!files || files.length === 0) return;
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: crypto?.randomUUID?.() ?? `${Date.now()}-${file.name}`,
        file,
        fileName: file.name,
        status: "pending" as const,
        result: null,
        error: null,
        retryCount: 0,
      })),
    ]);
  };

  const clear = () => {
    setItems([]);
    setIsAnalyzing(false);
  };

  return {
    isAnalyzing,
    items,
    hasPending,
    enqueue,
    clear,
  };
};
