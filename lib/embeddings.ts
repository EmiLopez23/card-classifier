import { pipeline, env, ImageFeatureExtractionPipeline, FeatureExtractionPipeline, RawImage } from "@xenova/transformers";

// Disable local model storage in browser-like environments
env.allowLocalModels = false;

// Cache for embedding models (singleton pattern)
let textEmbeddingPipeline: FeatureExtractionPipeline | null = null;
let clipTextPipeline: FeatureExtractionPipeline | null = null;
let clipVisionPipeline: ImageFeatureExtractionPipeline | null = null;

/**
 * Generate text embeddings using a sentence transformer model
 * Used for semantic search against text descriptions of cards
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  try {
    if (!textEmbeddingPipeline) {
      console.log("Loading text embedding model...");
      textEmbeddingPipeline = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
    }

    const output = await textEmbeddingPipeline(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(output.data);
  } catch (error) {
    console.error("Error generating text embedding:", error);
    throw new Error("Failed to generate text embedding");
  }
}

/**
 * Generate CLIP text embeddings
 * Used to match text queries against image embeddings
 */
export async function generateCLIPTextEmbedding(
  text: string
): Promise<number[]> {
  try {
    if (!clipTextPipeline) {
      console.log("Loading CLIP text model...");
      clipTextPipeline = await pipeline(
        "feature-extraction",
        "Xenova/clip-vit-base-patch32"
      );
    }

    const output = await clipTextPipeline(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(output.data);
  } catch (error) {
    console.error("Error generating CLIP text embedding:", error);
    throw new Error("Failed to generate CLIP text embedding");
  }
}

/**
 * Generate CLIP image embeddings
 * Used for visual similarity search
 */
export async function generateCLIPImageEmbedding(
  imageBuffer: RawImage
): Promise<number[]> {
  try {
    if (!clipVisionPipeline) {
      console.log("Loading CLIP vision model...");
      clipVisionPipeline = await pipeline(
        "image-feature-extraction",
        "Xenova/clip-vit-base-patch32"
      );
    }

    const output = await clipVisionPipeline(imageBuffer);

    return Array.from(output.data);
  } catch (error) {
    console.error("Error generating CLIP image embedding:", error);
    throw new Error("Failed to generate CLIP image embedding");
  }
}

/**
 * Create a rich text description from PSA card data
 * This text will be embedded for semantic search
 */
export function createCardTextDescription(cardData: any): string {
  const parts = [
    // Player info
    `${cardData.player.name}`,
    cardData.player.team,
    cardData.player.position,

    // Card details
    `${cardData.card.year} ${cardData.card.brand}`,
    cardData.card.setName,
    cardData.card.variant,
    cardData.card.cardType,

    // PSA info
    `PSA ${cardData.psa.grade}`,
    cardData.psa.gradeLabel,

    // Flags
    cardData.card.rookie ? "Rookie Card" : null,
    cardData.card.autographed ? "Autographed" : null,
    cardData.card.serialNumber ? `Serial #${cardData.card.serialNumber}` : null,

    // Metadata
    cardData.metadata.rarity,
    cardData.metadata.description,
  ];

  return parts.filter(Boolean).join(" ");
}
