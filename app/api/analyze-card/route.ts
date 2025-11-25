import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PSACardSchema, errorSchema } from "@/lib/schemas";
import { storeCardEmbeddings } from "@/lib/vector-store";
import { randomUUID } from "crypto";
import { SYSTEM_PROMPT, USER_PROMPT } from "@/lib/const";

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

    // Convert file to base64 for AI processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");
    const mimeType = file.type;

    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: PSACardSchema.or(errorSchema),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: USER_PROMPT,
            },
            {
              type: "image",
              image: `data:${mimeType};base64,${base64}`,
            },
          ],
        },
      ],
    });

    if ("error" in result.object) {
      return NextResponse.json(result.object, { status: 400 });
    }

    // Store embeddings in Pinecone (async, don't block response)
    const cardId = randomUUID();

    storeCardEmbeddings(cardId, result.object, buffer).catch((error) => {
      console.error("Failed to store embeddings:", error);
      // Don't fail the request if embedding storage fails
    });

    return NextResponse.json({
      ...result.object,
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
