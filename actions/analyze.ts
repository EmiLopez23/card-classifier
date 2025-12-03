"use server";
import { executeAnalyzerGraph } from "@/lib/agent";
import { randomUUID } from "crypto";

export async function analyzeCard(formData: FormData, cardId?: string) {
  const file = formData.get("file") as File | null;
  const userHint = formData.get("hint") as string | null;

  if (!file) {
    return {
      error: "image_not_supported",
      reason: "No file provided" as const,
    };
  }

  // Convert file to base64 and buffer for AI processing and embeddings
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const mimeType = file.type;

  // Generate card ID if not provided
  const id = cardId || randomUUID();

  // Use LangGraph state machine with full pipeline
  const result = await executeAnalyzerGraph(
    base64,
    mimeType,
    id,
    buffer,
    userHint || undefined
  );

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

  // Include all results from the agent
  return {
    ...result.validatedCard,
    certification: result.certificationResult,
    description: result.description,
    webSearchResults: result.webSearchResults,
    savedToDatabase: result.savedToDatabase,
    cardId: result.cardId,
  };
}
