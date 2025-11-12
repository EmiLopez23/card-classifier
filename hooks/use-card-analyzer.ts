import { ErrorResponse, PSACard } from "@/lib/schemas";
import { useState } from "react";
import { analyzeCard } from "@/lib/api";

export const useCardAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PSACard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (formData: FormData) => {
    setIsAnalyzing(true);

    try {
      const response = await analyzeCard(formData);
      if (!response.ok || "error" in response) {
        const errorData = response as ErrorResponse;
        setError(errorData.reason);
      } else {
        setResult(response as PSACard);
      }
    } catch (error) {
      setError(error as string);
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
