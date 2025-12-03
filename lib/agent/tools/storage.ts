import { CardAnalysisStateType } from "./types";
import { createError, withErrorHandling } from "./helpers";
import { storeCardEmbeddings } from "@/lib/vector-store";

/**
 * Save card data and embeddings to Pinecone
 *
 * @param state - Current agent state
 * @returns Updated state with save status
 */
export async function saveToDatabase(
  state: CardAnalysisStateType
): Promise<Partial<CardAnalysisStateType>> {
  console.log("TOOL CALLED:Saving card to database");
  const { cardId, validatedCard, imageBuffer, mimeType } = state;

  if (!cardId || !validatedCard || !imageBuffer) {
    return createError("Missing required data for database save");
  }

  // Store embeddings in Pinecone
  await storeCardEmbeddings(cardId, validatedCard, imageBuffer, mimeType);

  return {
    savedToDatabase: true,
    currentStep: "complete",
  };
}

/**
 * Save tool with error handling wrapper
 */
export const saveToDatabaseTool = withErrorHandling(
  saveToDatabase,
  "Database save failed"
);
