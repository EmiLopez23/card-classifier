import { NextRequest, NextResponse } from "next/server";
import { hybridSearch } from "@/lib/vector-store";

export const maxDuration = 30;

/**
 * POST /api/search-cards
 *
 * Performs hybrid retrieval combining text and image similarity
 *
 * Request body:
 * {
 *   query: string;           // Search query (e.g., "LeBron James rookie card")
 *   textWeight?: number;     // Weight for text similarity (0-1), default 0.5
 *   imageWeight?: number;    // Weight for image similarity (0-1), default 0.5
 *   topK?: number;          // Number of results to return, default 10
 *   filters?: {             // Optional metadata filters
 *     player_name?: string;
 *     card_year?: number;
 *     psa_grade?: number;
 *     card_rookie?: boolean;
 *     // ... any other metadata field
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "Query parameter is required and must be a string",
        },
        { status: 400 }
      );
    }

    // Extract and validate parameters
    const { query, textWeight = 1, imageWeight = 0, topK = 10, filters } = body;

    // Validate weights
    if (
      typeof textWeight !== "number" ||
      typeof imageWeight !== "number" ||
      textWeight + imageWeight !== 1
    ) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "Weights must sum to 1",
        },
        { status: 400 }
      );
    }

    // Validate topK
    if (typeof topK !== "number" || topK < 1 || topK > 100) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "topK must be a number between 1 and 100",
        },
        { status: 400 }
      );
    }

    // Perform hybrid search
    const results = await hybridSearch({
      query,
      textWeight,
      imageWeight,
      topK,
      filter: filters,
    });

    // Format response
    return NextResponse.json({
      query,
      parameters: {
        textWeight,
        imageWeight,
        topK,
        filters: filters || null,
      },
      resultCount: results.length,
      results: results.map((result) => ({
        cardId: result.cardId,
        scores: {
          text: result.textScore,
          image: result.imageScore,
          combined: result.combinedScore,
        },
        card: {
          // Player info
          player: {
            name: result.metadata.player_name,
            team: result.metadata.player_team,
            position: result.metadata.player_position || undefined,
          },
          // Card details
          card: {
            year: result.metadata.card_year,
            brand: result.metadata.card_brand,
            setName: result.metadata.card_set_name,
            cardNumber: result.metadata.card_number,
            variant: result.metadata.card_variant || undefined,
            cardType: result.metadata.card_type || undefined,
            serialNumber: result.metadata.card_serial_number || undefined,
            autographed: result.metadata.card_autographed,
            rookie: result.metadata.card_rookie,
          },
          // PSA info
          psa: {
            certificationNumber: result.metadata.psa_cert_number,
            grade: result.metadata.psa_grade,
            gradeLabel: result.metadata.psa_grade_label,
            autographGrade: result.metadata.psa_autograph_grade || undefined,
          },
          // Metadata
          metadata: {
            sport: result.metadata.sport,
            rarity: result.metadata.rarity || undefined,
            estimatedValue: result.metadata.estimated_value || undefined,
            description: result.metadata.description || undefined,
          },
          // Text description
          textDescription: result.metadata.text_description,
          timestamp: result.metadata.timestamp,
        },
      })),
    });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error: "search_failed",
        message: error.message || "An error occurred while searching",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search-cards?query=...
 *
 * Simplified search endpoint for quick queries
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "Query parameter is required",
        },
        { status: 400 }
      );
    }

    const topK = parseInt(searchParams.get("topK") || "10");
    const textWeight = parseFloat(searchParams.get("textWeight") || "0.5");
    const imageWeight = parseFloat(searchParams.get("imageWeight") || "0.5");

    // Perform search using POST handler logic
    const results = await hybridSearch({
      query,
      textWeight,
      imageWeight,
      topK,
    });

    return NextResponse.json({
      query,
      resultCount: results.length,
      results: results.map((result) => ({
        cardId: result.cardId,
        combinedScore: result.combinedScore,
        textScore: result.textScore,
        imageScore: result.imageScore,
        description: result.metadata.text_description,
        playerName: result.metadata.player_name,
        year: result.metadata.card_year,
        brand: result.metadata.card_brand,
        grade: result.metadata.psa_grade,
      })),
    });
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      {
        error: "search_failed",
        message: error.message || "An error occurred while searching",
      },
      { status: 500 }
    );
  }
}
