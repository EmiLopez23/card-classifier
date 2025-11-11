import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { psaCardSchema, errorResponseSchema } from "@/lib/schemas";

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

    // First, validate if this is a PSA certified NBA card
    const validationPrompt = `Analyze this image carefully. Is this a PSA (Professional Sports Authenticator) certified NBA basketball card?

Look for:
1. PSA certification label/holder (clear plastic case with PSA branding)
2. PSA grade number (1-10 scale)
3. PSA certification number
4. An NBA player on the card
5. Card manufacturer and set information visible

Respond with "valid" if this is clearly a PSA certified NBA card, or provide a specific reason why it's not valid.`;

    try {
      // Use Gemini to validate the image first
      const model = google("gemini-2.0-flash-exp");

      const validation = await generateObject({
        model,
        schema: errorResponseSchema.or(
          z.object({ status: z.literal("valid") })
        ),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: validationPrompt,
              },
              {
                type: "image",
                image: `data:${mimeType};base64,${base64}`,
              },
            ],
          },
        ],
      });

      // If validation fails, return error
      if ("error" in validation.object) {
        return NextResponse.json(validation.object, { status: 400 });
      }

      // If valid, extract card information
      const extractionPrompt = `This is a PSA certified NBA basketball card. Extract ALL visible information from the card with extreme accuracy.

Pay special attention to:
- PSA label: certification number, grade, grade label (MINT, GEM MT, etc.)
- Player name and team
- Card year, brand/manufacturer (Topps, Panini, Upper Deck, etc.)
- Set name and card number
- Any special variants (Rookie Card, Refractor, Prizm, etc.)
- Serial numbers if present
- Whether it's autographed
- Whether it's a rookie card

Be thorough and accurate. Extract every detail visible on both the PSA label and the card itself.`;

      const result = await generateObject({
        model,
        schema: psaCardSchema,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: extractionPrompt,
              },
              {
                type: "image",
                image: `data:${mimeType};base64,${base64}`,
              },
            ],
          },
        ],
      });

      return NextResponse.json(result.object);
    } catch (error: any) {
      console.error("AI processing error:", error);

      // Handle AI-specific errors
      if (error.message?.includes("API key")) {
        return NextResponse.json(
          {
            error: "image_not_supported",
            reason: "API authentication failed",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          error: "image_not_supported",
          reason:
            "Failed to analyze the image. The image may not be clear enough or may not contain a PSA certified NBA card.",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      {
        error: "image_not_supported",
        reason: "Failed to process the request",
      },
      { status: 500 }
    );
  }
}
