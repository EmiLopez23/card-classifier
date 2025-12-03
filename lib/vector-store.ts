import { getTextIndex, getImageIndex } from "./pinecone";
import {
  generateTextEmbedding,
  generateCLIPImageEmbedding,
  createCardTextDescription,
  generateCLIPTextEmbedding,
} from "./embeddings";
import { PSACard } from "./schemas";
import { RawImage } from "@xenova/transformers";

export interface CardVectorRecord {
  cardId: string;
  cardData: PSACard;
  textEmbedding: number[];
  imageEmbedding: number[];
  timestamp: string;
}

/**
 * Store card embeddings in Pinecone
 * Creates two separate records: one for text search, one for image search
 */
export async function storeCardEmbeddings(
  cardId: string,
  cardData: PSACard,
  imageBuffer: Buffer,
  mimeType?: string
): Promise<void> {
  try {
    const textIndex = getTextIndex();
    const imageIndex = getImageIndex();
    const namespace = "cards";

    // Generate text description and embedding
    const textDescription = createCardTextDescription(cardData);
    const textEmbedding = await generateTextEmbedding(textDescription);

    // Convert Buffer to RawImage and generate image embedding
    // RawImage.read() can automatically detect the image format from the buffer
    const uint8Array = new Uint8Array(imageBuffer);
    const blob = new Blob([uint8Array], { type: mimeType || "image/jpeg" });
    const rawImage = await RawImage.fromBlob(blob);
    const imageEmbedding = await generateCLIPImageEmbedding(rawImage);

    // Prepare metadata (flatten for Pinecone compatibility)
    const metadata = {
      cardId,
      timestamp: new Date().toISOString(),

      // Player info
      player_name: cardData.player.name,
      player_team: cardData.player.team,
      player_position: cardData.player.position || "",

      // Card details
      card_year: cardData.card.year,
      card_brand: cardData.card.brand,
      card_set_name: cardData.card.setName,
      card_number: cardData.card.cardNumber,
      card_variant: cardData.card.variant || "",
      card_type: cardData.card.cardType || "",
      card_serial_number: cardData.card.serialNumber || "",
      card_autographed: cardData.card.autographed,
      card_rookie: cardData.card.rookie,

      // PSA info
      psa_cert_number: cardData.psa.certificationNumber,
      psa_grade: cardData.psa.grade,
      psa_grade_label: cardData.psa.gradeLabel,
      psa_autograph_grade: cardData.psa.autographGrade || 0,

      // Metadata
      sport: cardData.metadata.sport,
      rarity: cardData.metadata.rarity || "",
      estimated_value: cardData.metadata.estimatedValue || "",
      description: cardData.metadata.description || "",

      // Full text description for display
      text_description: textDescription,
    };

    // Store text embedding in text index (384 dimensions)
    await textIndex.namespace(namespace).upsert([
      {
        id: cardId,
        values: textEmbedding,
        metadata,
      },
    ]);

    // Store image embedding in image index (512 dimensions)
    await imageIndex.namespace(namespace).upsert([
      {
        id: cardId,
        values: imageEmbedding,
        metadata,
      },
    ]);

    console.log(`✓ Stored embeddings for card: ${cardId}`);
  } catch (error) {
    console.error("Error storing card embeddings:", error);
    throw new Error("Failed to store card embeddings");
  }
}

/**
 * Query interface for hybrid retrieval
 */
export interface HybridSearchParams {
  query: string;
  textWeight?: number; // Weight for text similarity (0-1), default 0.5
  imageWeight?: number; // Weight for image similarity (0-1), default 0.5
  topK?: number; // Number of results to return, default 10
  filter?: Record<string, any>; // Optional metadata filters
}

/**
 * Perform hybrid search combining text and image embeddings
 *
 * Queries both text and image indexes in parallel, combines results by card ID,
 * and returns weighted scores based on textWeight and imageWeight parameters.
 *
 * For metadata-only searches (empty query), uses a generic "card" query to
 * generate embeddings, with filters doing the heavy lifting.
 */
export async function hybridSearch(params: HybridSearchParams): Promise<any[]> {
  const {
    query,
    textWeight = 0.6,
    imageWeight = 0.4,
    topK = 10,
    filter = {},
  } = params;

  try {
    const textIndex = getTextIndex();
    const imageIndex = getImageIndex();
    const namespace = "cards";

    // For empty queries (metadata-only search), use a generic term
    const searchQuery = query.trim() || "card";

    // Generate embeddings for the query
    const textEmbedding = await generateTextEmbedding(searchQuery);

    // Note: For true image-to-image search, we'd need an image query
    // For now, we use the same text-based approach for both indexes
    const imageEmbedding = await generateCLIPTextEmbedding(searchQuery); // Placeholder - same embedding for both

    // Query both indexes in parallel (get more results to merge)
    const [textResults, imageResults] = await Promise.all([
      textIndex.namespace(namespace).query({
        vector: textEmbedding,
        topK: topK * 2,
        includeMetadata: true,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      }),
      imageIndex.namespace(namespace).query({
        vector: imageEmbedding,
        topK: topK * 2,
        includeMetadata: true,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      }),
    ]);

    // Create a map to combine scores by card ID
    const combinedScores = new Map<string, any>();

    // Process text results
    (textResults.matches || []).forEach((match) => {
      if (!match.metadata) return;

      combinedScores.set(match.id, {
        cardId: match.id,
        textScore: match.score || 0,
        imageScore: 0,
        combinedScore: 0,
        metadata: match.metadata,
      });
    });

    // Process image results and merge
    (imageResults.matches || []).forEach((match) => {
      if (!match.metadata) return;

      const existing = combinedScores.get(match.id);

      if (existing) {
        // Card exists in both results - update image score
        existing.imageScore = match.score || 0;
      } else {
        // Card only in image results
        combinedScores.set(match.id, {
          cardId: match.id,
          textScore: 0,
          imageScore: match.score || 0,
          combinedScore: 0,
          metadata: match.metadata,
        });
      }
    });

    // Calculate combined scores and sort
    const results = Array.from(combinedScores.values())
      .map((result) => ({
        ...result,
        combinedScore:
          result.textScore * textWeight + result.imageScore * imageWeight,
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topK);

    console.log(`Hybrid search returned ${results.length} results`);

    return results;
  } catch (error) {
    console.error("Error performing hybrid search:", error);
    throw new Error("Failed to perform hybrid search");
  }
}

/**
 * Merge text and image search results with weighted scoring
 */
function mergeResults(
  textMatches: any[],
  imageMatches: any[],
  textWeight: number,
  imageWeight: number
): any[] {
  // Create a map of cardId -> combined score
  const scoreMap = new Map<string, any>();

  // Process text results
  for (const match of textMatches) {
    const cardId = match.metadata?.cardId;
    if (!cardId) continue;

    scoreMap.set(cardId, {
      cardId,
      metadata: match.metadata,
      textScore: match.score || 0,
      imageScore: 0,
      combinedScore: (match.score || 0) * textWeight,
    });
  }

  // Process image results
  for (const match of imageMatches) {
    const cardId = match.metadata?.cardId;
    if (!cardId) continue;

    if (scoreMap.has(cardId)) {
      const existing = scoreMap.get(cardId);
      existing.imageScore = match.score || 0;
      existing.combinedScore += (match.score || 0) * imageWeight;
    } else {
      scoreMap.set(cardId, {
        cardId,
        metadata: match.metadata,
        textScore: 0,
        imageScore: match.score || 0,
        combinedScore: (match.score || 0) * imageWeight,
      });
    }
  }

  // Convert to array and sort by combined score
  return Array.from(scoreMap.values()).sort(
    (a, b) => b.combinedScore - a.combinedScore
  );
}
