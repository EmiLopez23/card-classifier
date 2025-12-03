import { useState, useCallback } from "react";
import { PSACardWithCertification } from "@/lib/schemas";

export interface AgentStep {
  step: string;
  timestamp: string;
  data: any;
  currentStep: string;
  error?: any;
}

export type StreamResult = PSACardWithCertification & {
  description?: string;
  webSearchResults?: any[];
  savedToDatabase?: boolean;
  cardId?: string;
};

/**
 * Hook for streaming card analysis with real-time step updates
 */
export const useCardAnalyzerStream = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [result, setResult] = useState<StreamResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeWithStream = useCallback(
    async (file: File, hint?: string) => {
      setIsAnalyzing(true);
      setSteps([]);
      setCurrentStep(null);
      setResult(null);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      if (hint) formData.append("hint", hint);

      try {
        const response = await fetch("/api/analyze-card/stream", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to analyze card");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));

              if (data.type === "done") {
                setIsAnalyzing(false);
                setCurrentStep("complete");
              } else if (data.type === "error") {
                setError(data.reason);
                setIsAnalyzing(false);
              } else {
                // Agent step update
                setSteps((prev) => [...prev, data]);
                setCurrentStep(data.step);

                // Build result progressively
                if (data.data.validatedCard) {
                  setResult((prev) => ({
                    ...(prev || data.data.validatedCard),
                    ...data.data.validatedCard,
                    certification:
                      data.data.certificationResult || prev?.certification,
                    description: data.data.description || prev?.description,
                    webSearchResults:
                      data.data.webSearchResults || prev?.webSearchResults,
                    savedToDatabase:
                      data.data.savedToDatabase ?? prev?.savedToDatabase,
                    cardId: data.data.cardId || prev?.cardId,
                  }));
                } else if (data.data.certificationResult && result) {
                  setResult((prev) => ({
                    ...prev!,
                    certification: data.data.certificationResult,
                  }));
                } else if (data.data.description && result) {
                  setResult((prev) => ({
                    ...prev!,
                    description: data.data.description,
                    webSearchResults: data.data.webSearchResults,
                  }));
                } else if (data.data.savedToDatabase !== undefined && result) {
                  setResult((prev) => ({
                    ...prev!,
                    savedToDatabase: data.data.savedToDatabase,
                    cardId: data.data.cardId,
                  }));
                }
              }
            }
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to analyze card");
        setIsAnalyzing(false);
      }
    },
    [result]
  );

  const clearSteps = useCallback(() => {
    setSteps([]);
    setCurrentStep(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    analyzeWithStream,
    isAnalyzing,
    steps,
    currentStep,
    result,
    error,
    clearSteps,
  };
};
