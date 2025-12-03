import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { PSACardSchema, errorSchema } from "@/lib/schemas";
import { CardAnalysisStateType, PSACard } from "./types";
import { createError, withErrorHandling } from "./helpers";
import { SYSTEM_PROMPT, USER_PROMPT } from "@/lib/const";

/**
 * Extract card information from image using multimodal AI
 *
 * @param state - Current agent state
 * @returns Updated state with extracted information
 */
export async function extractCardInformation(
  state: CardAnalysisStateType
): Promise<Partial<CardAnalysisStateType>> {
  console.log("TOOL CALLED:Extracting card information");
  const model = google("gemini-2.5-flash");
  const result = await generateObject({
    model,
    schema: PSACardSchema.or(errorSchema),
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: USER_PROMPT },
          {
            type: "image",
            image: `data:${state.mimeType};base64,${state.imageBase64}`,
          },
        ],
      },
    ],
  });

  if ("error" in result.object) {
    return {
      error: result.object,
      currentStep: "error",
    };
  }

  return {
    extractedInfo: result.object as Partial<PSACard>,
    currentStep: "validate",
  };
}

/**
 * Extract tool with error handling wrapper
 */
export const extractCardInformationTool = withErrorHandling(
  extractCardInformation,
  "Extraction failed"
);
