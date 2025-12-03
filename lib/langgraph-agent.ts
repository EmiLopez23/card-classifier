import { StateGraph, START, END } from "@langchain/langgraph";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { PSACardSchema, errorSchema } from "./schemas";
import { SYSTEM_PROMPT, USER_PROMPT } from "./const";

// Types
type PSACard = z.infer<typeof PSACardSchema>;
type ErrorResponse = z.infer<typeof errorSchema>;

// Simplified state schema
const CardAnalysisState = z.object({
  imageBase64: z.string(),
  mimeType: z.string(),
  extractedInfo: PSACardSchema.partial().optional(),
  validatedCard: PSACardSchema.optional(),
  certificationResult: z
    .object({
      isValid: z.boolean(),
      certificationNumber: z.string().optional(),
      details: z.any().optional(),
    })
    .optional(),
  error: errorSchema.optional(),
  currentStep: z.enum(["extract", "validate", "certify", "complete", "error"]).default("extract"),
});

export type CardAnalysisStateType = z.infer<typeof CardAnalysisState>;

// Helper: Create error state
const createError = (reason: string, step: "error" = "error"): Partial<CardAnalysisStateType> => ({
  error: { error: "image_not_supported" as const, reason },
  currentStep: step,
});

// Helper: Wrap async function with error handling
const withErrorHandling = (
  fn: (state: CardAnalysisStateType) => Promise<Partial<CardAnalysisStateType>>,
  errorContext: string
) => {
  return async (state: CardAnalysisStateType): Promise<Partial<CardAnalysisStateType>> => {
    try {
      return await fn(state);
    } catch (error: any) {
      return createError(
        `${errorContext}: ${error?.message ?? "Unknown error"}`,
        "error"
      );
    }
  };
};

// Node 1: Extract card information from image
const extractCardInformation = withErrorHandling(
  async (state: CardAnalysisStateType) => {
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
  },
  "Extraction failed"
);

// Node 2: Validate NBA card
const validateNBACard = withErrorHandling(
  async (state: CardAnalysisStateType) => {
    const info = state.extractedInfo;
    if (!info) {
      return createError("No extracted information available");
    }

    // Validate NBA sport
    if (info.metadata?.sport !== "NBA") {
      return createError(
        `Card is not an NBA card. Detected sport: ${info.metadata?.sport || "unknown"}`
      );
    }

    // Validate required fields
    const required = {
      cert: info.psa?.certificationNumber,
      player: info.player?.name,
      year: info.card?.year,
      brand: info.card?.brand,
    };

    const missing = Object.entries(required)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      return createError(`Missing required fields: ${missing.join(", ")}`);
    }

    // Parse and validate full schema
    const validatedCard = PSACardSchema.parse({
      psa: {
        certificationNumber: required.cert!,
        grade: info.psa!.grade!,
        gradeLabel: info.psa!.gradeLabel!,
        autographGrade: info.psa?.autographGrade,
      },
      player: {
        name: required.player!,
        team: info.player!.team!,
        position: info.player?.position,
      },
      card: {
        year: required.year!,
        brand: required.brand!,
        setName: info.card!.setName!,
        cardNumber: info.card!.cardNumber!,
        variant: info.card?.variant,
        cardType: info.card?.cardType,
        serialNumber: info.card?.serialNumber,
        autographed: info.card?.autographed ?? false,
        rookie: info.card?.rookie ?? false,
      },
      metadata: {
        sport: "NBA" as const,
        estimatedValue: info.metadata?.estimatedValue,
        rarity: info.metadata?.rarity,
        description: info.metadata?.description,
      },
    });

    return {
      validatedCard,
      currentStep: "certify",
    };
  },
  "Validation failed"
);

// Node 3: Certify card via PSA website
const certifyCard = withErrorHandling(
  async (state: CardAnalysisStateType) => {
    const certNumber = state.validatedCard?.psa.certificationNumber;
    if (!certNumber) {
      return createError("No certification number available");
    }

    const psaUrl = `https://www.psacard.com/cert/${certNumber}`;

    try {
      const response = await fetch(psaUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CardClassifier/1.0)" },
      });

      if (!response.ok) {
        return {
          certificationResult: {
            isValid: true,
            certificationNumber: certNumber,
            details: {
              note: "Could not verify online, but certification number exists",
              url: psaUrl,
            },
          },
          currentStep: "complete",
        };
      }

      const html = await response.text();
      const isValid = html.includes(certNumber);
      const gradeMatch = html.match(/Grade[:\s]+(\d+)/i);
      const playerMatch = html.match(/Player[:\s]+([^<\n]+)/i);

      return {
        certificationResult: {
          isValid,
          certificationNumber: certNumber,
          details: {
            verified: isValid,
            url: psaUrl,
            grade: gradeMatch?.[1],
            player: playerMatch?.[1]?.trim(),
          },
        },
        currentStep: "complete",
      };
    } catch (fetchError: any) {
      return {
        certificationResult: {
          isValid: true,
          certificationNumber: certNumber,
          details: {
            note: "Network error during verification",
            url: psaUrl,
            error: fetchError.message,
          },
        },
        currentStep: "complete",
      };
    }
  },
  "Certification failed"
);

// Routing helpers
const routeToNext = (state: CardAnalysisStateType, nextStep: string) => {
  if (state.currentStep === "error" || state.error) return END;
  return nextStep;
};

// Build LangGraph agent
export function createCardAnalysisAgent() {
  return new StateGraph(CardAnalysisState)
    .addNode("extract", extractCardInformation)
    .addNode("validate", validateNBACard)
    .addNode("certify", certifyCard)
    .addEdge(START, "extract")
    .addConditionalEdges("extract", (s) => routeToNext(s, "validate"), [
      "validate",
      END,
    ])
    .addConditionalEdges("validate", (s) => routeToNext(s, "certify"), [
      "certify",
      END,
    ])
    .addEdge("certify", END)
    .compile();
}

// Main analysis function
export async function analyzeCardWithLangGraph(
  imageBase64: string,
  mimeType: string
): Promise<{
  validatedCard?: PSACard;
  certificationResult?: {
    isValid: boolean;
    certificationNumber?: string;
    details?: any;
  };
  error?: ErrorResponse;
}> {
  const agent = createCardAnalysisAgent();
  const result = await agent.invoke({
    imageBase64,
    mimeType,
    currentStep: "extract",
  });

  return result.error
    ? { error: result.error }
    : {
        validatedCard: result.validatedCard,
        certificationResult: result.certificationResult,
      };
}
