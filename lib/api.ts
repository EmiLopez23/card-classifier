import { ErrorResponse, PSACard } from "./schemas";

export const analyzeCard = async (formData: FormData) => {
  const response = await fetch("/api/analyze-card", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const error = (await response.json()) as ErrorResponse;
    throw new Error(error.reason);
  }
  return (await response.json()) as PSACard;
};
