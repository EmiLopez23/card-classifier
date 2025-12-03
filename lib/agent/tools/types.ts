import { errorSchema, PSACardSchema } from "@/lib/schemas";
import { z } from "zod";

// Types
export type PSACard = z.infer<typeof PSACardSchema>;
export type ErrorResponse = z.infer<typeof errorSchema>;

// Extended state schema with all new fields
export const CardAnalysisState = z.object({
  imageBase64: z.string(),
  mimeType: z.string(),
  imageBuffer: z.instanceof(Buffer).optional(),
  cardId: z.string().optional(),
  userHint: z.string().optional(),
  extractedInfo: PSACardSchema.partial().optional(),
  validatedCard: PSACardSchema.optional(),
  certificationResult: z
    .object({
      isValid: z.boolean(),
      certificationNumber: z.string().optional(),
      details: z.any().optional(),
    })
    .optional(),
  description: z.string().optional(),
  webSearchResults: z.array(z.any()).optional(),
  textEmbedding: z.array(z.number()).optional(),
  imageEmbedding: z.array(z.number()).optional(),
  savedToDatabase: z.boolean().optional(),
  error: errorSchema.optional(),
  currentStep: z
    .enum([
      "extract",
      "validate",
      "certify",
      "describe",
      "embeddings",
      "save",
      "complete",
      "error",
    ])
    .default("extract"),
});

export type CardAnalysisStateType = z.infer<typeof CardAnalysisState>;
