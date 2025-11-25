"use server";
import { SYSTEM_PROMPT, USER_PROMPT } from "@/lib/const";
import { errorSchema, PSACardSchema } from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";

export async function analyzeCard(formData: FormData) {
  const file = formData.get("file") as File | null;

  if (!file) {
    return { error: "image_not_supported", reason: "No file provided" as const };
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
          { type: "text", text: USER_PROMPT },
          { type: "image", image: `data:${mimeType};base64,${base64}` },
        ],
      },
    ],
  });

  return result.object;
}
