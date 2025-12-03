import { NextRequest, NextResponse } from "next/server";
import { analyzeCard } from "@/actions/analyze";
import { storeCardEmbeddings } from "@/lib/vector-store";
import { randomUUID } from "crypto";
import { PSACardSchema } from "@/lib/schemas";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

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

    // Use LangGraph-based analyzeCard action
    const result = await analyzeCard(formData);

    // Check if result is an error
    if ("error" in result) {
      return NextResponse.json(result, { status: 400 });
    }

    // Validate that we have a valid card (should be guaranteed by LangGraph)
    const validatedCard = PSACardSchema.parse(result);

    // Store embeddings in Pinecone (async, don't block response)
    const cardId = randomUUID();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    storeCardEmbeddings(cardId, validatedCard, buffer, file.type).catch((error) => {
      console.error("Failed to store embeddings:", error);
      // Don't fail the request if embedding storage fails
    });

    return NextResponse.json({
      ...validatedCard,
      certification: result.certification, // Include certification result from LangGraph
      cardId, // Include the generated card ID in the response
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
