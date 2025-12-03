import { NextRequest, NextResponse } from "next/server";
import { analyzeCard } from "@/actions/analyze";
import { randomUUID } from "crypto";
import { PSACardSchema } from "@/lib/schemas";

export const maxDuration = 60; // Increased for full agent pipeline

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const hint = formData.get("hint") as string | null;

    if (!file) {
      return NextResponse.json(
        {
          error: "image_not_supported",
          reason: "No file provided",
        },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "image/png",
      "image/jpg",
      "image/jpeg",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "image_not_supported",
          reason:
            "Invalid file type. Only images (PNG, JPG, GIF, WEBP) and PDFs are supported.",
        },
        { status: 400 }
      );
    }

    // Generate card ID upfront
    const cardId = randomUUID();

    // Use LangGraph-based analyzeCard action with full pipeline
    // This now handles: extract → validate → certify → describe → embeddings → save
    const result = await analyzeCard(formData, cardId);

    // Check if result is an error
    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }

    // Validate that we have a valid card (should be guaranteed by LangGraph)
    const validatedCard = PSACardSchema.parse(result);

    // All processing (including embeddings and storage) is now done by the agent
    return NextResponse.json({
      ...validatedCard,
      certification: result.certification,
      description: result.description,
      webSearchResults: result.webSearchResults,
      savedToDatabase: result.savedToDatabase,
      cardId: result.cardId,
    });
  } catch (error: any) {
    console.error("Request processing error:", error);
    const message = String(error?.message ?? "");
    const statusCode = Number(error?.statusCode ?? 0);
    const isOverloaded =
      statusCode === 503 ||
      message.toLowerCase().includes("overloaded") ||
      message.toLowerCase().includes("unavailable");

    if (isOverloaded) {
      return NextResponse.json(
        {
          error: "model_overloaded",
          reason: "The model is overloaded. Retrying shortly.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "image_not_supported",
        reason: message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
