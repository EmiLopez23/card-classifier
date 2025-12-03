import { PSACardWithCertification } from "@/lib/schemas";
import { useEffect, useMemo, useState } from "react";
import { analyzeCard } from "@/lib/api";

export const useCardAnalyzer = () => {
  type QueueItem = {
    id: string;
    file: File;
    fileName: string;
    hint?: string;
    status: "pending" | "processing" | "done" | "error";
    result: PSACardWithCertification | null;
    error: string | null;
    retryCount: number;
    nextAttemptAt?: number;
  };

  const [items, setItems] = useState<QueueItem[]>([]);

  const hasPending = useMemo(
    () => items.some((it) => it.status === "pending"),
    [items]
  );

  const MAX_RETRIES = 2;
  const MAX_CONCURRENCY = 3;

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
    const processingCount = items.filter(
      (it) => it.status === "processing"
    ).length;
    const capacity = Math.max(0, MAX_CONCURRENCY - processingCount);
    if (capacity === 0) return;

    const now = Date.now();
    const candidates: number[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (
        it.status === "pending" &&
        (!it.nextAttemptAt || it.nextAttemptAt <= now)
      ) {
        candidates.push(i);
        if (candidates.length >= capacity) break;
      }
    }
    if (candidates.length === 0) return;

    // Mark candidates as processing and start their analysis
    candidates.forEach((idx) => {
      const target = items[idx];
      if (!target) return;
      setItems((prev) =>
        prev.map((it, j) => (j === idx ? { ...it, status: "processing" } : it))
      );

      (async () => {
        try {
          const formData = new FormData();
          formData.append("file", target.file);
          if (target.hint) {
            formData.append("hint", target.hint);
          }
          const response = await analyzeCard(formData);
          setItems((prev) =>
            prev.map((it, j) =>
              j === idx
                ? { ...it, status: "done", result: response, error: null }
                : it
            )
          );
        } catch (err) {
          if (isTransientError(err) && target.retryCount < MAX_RETRIES) {
            const delayMs = 1000 * Math.pow(2, target.retryCount); // 1s, 2s
            const nextAt = Date.now() + delayMs;
            setItems((prev) =>
              prev.map((it, j) =>
                j === idx
                  ? {
                      ...it,
                      status: "pending",
                      error: null,
                      result: null,
                      retryCount: it.retryCount + 1,
                      nextAttemptAt: nextAt,
                    }
                  : it
              )
            );
          } else {
            const message =
              err instanceof Error ? err.message : "Unknown analysis error";
            setItems((prev) =>
              prev.map((it, j) =>
                j === idx
                  ? { ...it, status: "error", error: message, result: null }
                  : it
              )
            );
          }
        }
      })();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const enqueue = (files: File[], hint?: string) => {
    if (!files || files.length === 0) return;
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        id: crypto?.randomUUID?.() ?? `${Date.now()}-${file.name}`,
        file,
        fileName: file.name,
        hint,
        status: "pending" as const,
        result: null,
        error: null,
        retryCount: 0,
        nextAttemptAt: undefined,
      })),
    ]);
  };

  const clear = () => {
    setItems([]);
  };

  return {
    isAnalyzing: useMemo(
      () =>
        items.some(
          (it) => it.status === "processing" || it.status === "pending"
        ),
      [items]
    ),
    items,
    hasPending,
    enqueue,
    clear,
  };
};
