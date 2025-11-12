import { analyzeCard } from "@/actions/analyze";
import { ErrorResponse, PSACard } from "@/lib/schemas";
import { readStreamableValue, StreamableValue } from "@ai-sdk/rsc";
import { useState } from "react";

export const useCardAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PSACard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (formData: FormData) => {
    try {
      setIsAnalyzing(true);
      const { object } = await analyzeCard(formData);

      for await (const partialObject of readStreamableValue(
        object as StreamableValue<any, any>
      )) {
        if (partialObject) {
          setResult(partialObject);
        }
      }
    } catch (error: any) {
      setError(error.message as string);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setIsAnalyzing(false);
    setResult(null);
    setError(null);
  };

  return { isAnalyzing, result, error, analyze, reset };
};
