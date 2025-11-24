import { getTextIndex, getImageIndex } from "./pinecone";
import {
  generateTextEmbedding,
  generateCLIPImageEmbedding,
  createCardTextDescription,
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
  imageBuffer: Buffer
): Promise<void> {
  try {
    const textIndex = getTextIndex();
    const imageIndex = getImageIndex();
    const namespace = "cards"; // Using a single namespace for all cards

    // Generate text description and embedding
    const textDescription = createCardTextDescription(cardData);
    const textEmbedding = await generateTextEmbedding(textDescription);

    // Convert Buffer to RawImage and generate image embedding
    const uint8Array = new Uint8Array(imageBuffer);
    const blob = new Blob([uint8Array], { type: "image/png" });
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
 */
export async function hybridSearch(params: HybridSearchParams): Promise<any[]> {
  const {
    query,
    textWeight = 0.5,
    imageWeight = 0.5,
    topK = 10,
    filter,
  } = params;

  try {
    const textIndex = getTextIndex();
    const imageIndex = getImageIndex();
    const namespace = "cards";

    // Generate both embeddings from the text query
    const [textEmbedding, clipTextEmbedding] = await Promise.all([
      generateTextEmbedding(query),
      // CLIP text embedding will match against CLIP image embeddings
      import("./embeddings").then((m) => m.generateCLIPTextEmbedding(query)),
    ]);

    // Query text index
    const textResults = await textIndex.namespace(namespace).query({
      vector: textEmbedding,
      topK: topK * 2, // Get more candidates for reranking
      includeMetadata: true,
      filter,
    });

    // Query image index using CLIP text embedding
    const imageResults = await imageIndex.namespace(namespace).query({
      vector: clipTextEmbedding,
      topK: topK * 2,
      includeMetadata: true,
      filter,
    });

    // Merge and rerank results
    const mergedResults = mergeResults(
      textResults.matches || [],
      imageResults.matches || [],
      textWeight,
      imageWeight
    );

    // Return top K results
    return mergedResults.slice(0, topK);
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
