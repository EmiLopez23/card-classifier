import { RawImage } from "@xenova/transformers";
import {
  generateTextEmbedding,
  generateCLIPImageEmbedding,
} from "@/lib/embeddings";
import { CardAnalysisStateType } from "./types";
import { createError, withErrorHandling } from "./helpers";

/**
 * Generate text and image embeddings for hybrid RAG
 *
 * @param state - Current agent state
 * @returns Updated state with embeddings
 */
export async function generateEmbeddings(
  state: CardAnalysisStateType
): Promise<Partial<CardAnalysisStateType>> {
  console.log("TOOL CALLED:Generating embeddings");
  const card = state.validatedCard;
  const description = state.description;

  if (!card || !description) {
    return createError("Missing card or description for embedding generation");
  }

  if (!state.imageBuffer) {
    return createError("Missing image buffer for embedding generation");
  }

  // Generate text embedding from description
  const textEmbedding = await generateTextEmbedding(description);

  // Generate image embedding
  const uint8Array = new Uint8Array(state.imageBuffer);
  const blob = new Blob([uint8Array], {
    type: state.mimeType || "image/jpeg",
  });
  const rawImage = await RawImage.fromBlob(blob);
  const imageEmbedding = await generateCLIPImageEmbedding(rawImage);

  return {
    textEmbedding,
    imageEmbedding,
    currentStep: "save",
  };
}

/**
 * Embeddings tool with error handling wrapper
 */
export const generateEmbeddingsTool = withErrorHandling(
  generateEmbeddings,
  "Embedding generation failed"
);
