import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PSACardSchema, errorSchema } from "@/lib/schemas";

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
      system: `You are an expert PSA card grading specialist with deep knowledge of:
- NBA basketball cards from all eras (1950s-present)
- PSA grading standards and label formats
- Card manufacturers (Topps, Panini, Upper Deck, Fleer, etc.)
- Card variants (Rookie, Refractor, Prizm, Autographs, etc.)
- Authentication of PSA certification labels

Your task is to analyze images of PSA-graded NBA cards and extract accurate information.
If the image is NOT a valid PSA certified NBA card, return an error with a specific reason.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image. Extract ALL visible information if it's a valid PSA certified NBA card.
Focus on:
- PSA label: certification number, grade (1-10), grade label
- Player: name, team, position
- Card: year, brand, set name, card number, variants
- Special features: rookie card, autographed, serial numbers`,
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

    return NextResponse.json(result.object);
  } catch (error: any) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      {
        error: "image_not_supported",
        reason: error.message,
      },
      { status: 500 }
    );
  }
}
