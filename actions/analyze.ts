"use server";
import { analyzeCardWithLangGraph } from "@/lib/langgraph-agent";

export async function analyzeCard(formData: FormData) {
  const file = formData.get("file") as File | null;

  if (!file) {
    return { error: "image_not_supported", reason: "No file provided" as const };
  }

  // Convert file to base64 for AI processing
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const mimeType = file.type;

  // Use LangGraph state machine to analyze the card
  const result = await analyzeCardWithLangGraph(base64, mimeType);

  // Return the validated card if successful, otherwise return error
  if (result.error) {
    return result.error;
  }

  if (!result.validatedCard) {
    return {
      error: "image_not_supported" as const,
      reason: "Failed to validate card",
    };
  }

  // Include certification result in the response
  return {
    ...result.validatedCard,
    certification: result.certificationResult,
  };
}
