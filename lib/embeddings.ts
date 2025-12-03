import {
  pipeline,
  env,
  ImageFeatureExtractionPipeline,
  FeatureExtractionPipeline,
  RawImage,
} from "@xenova/transformers";

// Disable local model storage in browser-like environments
env.allowLocalModels = false;
const IMAGE_EMBED_WIDTH = 32;
const IMAGE_EMBED_HEIGHT = 16;
const IMAGE_EMBED_DIMS = IMAGE_EMBED_WIDTH * IMAGE_EMBED_HEIGHT; // 512 dims

// Cache for embedding models (singleton pattern)
let textEmbeddingPipeline: FeatureExtractionPipeline | null = null;
let clipVisionPipeline: ImageFeatureExtractionPipeline | null = null;

function normalizeVector(values: number[]): number[] {
  const norm =
    Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
  return values.map((value) => value / norm);
}
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
 * Generate text embedding from a search query for text-to-image similarity search
 * Uses a character-based hashing approach to create a 512-dimensional vector
 */
export async function generateCLIPTextEmbedding(
  query: string
): Promise<number[]> {
  try {
    const normalizedQuery = query.toLowerCase();
    const vector = new Array(IMAGE_EMBED_DIMS).fill(0);

    for (let i = 0; i < normalizedQuery.length; i++) {
      const charCode = normalizedQuery.charCodeAt(i);
      const idx = charCode % IMAGE_EMBED_DIMS;
      vector[idx] += 1;
    }

    return normalizeVector(vector);
  } catch (error) {
    console.error("Error generating CLIP text embedding:", error);
    throw new Error("Failed to generate CLIP text embedding");
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
