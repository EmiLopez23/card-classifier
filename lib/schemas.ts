import { z } from "zod";

// Schema for NBA PSA Certified Card
export const PSACardSchema = z.object({
  // PSA Information
  psa: z.object({
    certificationNumber: z
      .string()
      .describe("PSA certification number from the label"),
    grade: z.number().min(1).max(10).describe("PSA grade (1-10 scale)"),
    gradeLabel: z
      .string()
      .describe("Grade label (e.g., 'MINT', 'GEM MT', 'NM-MT')"),
    autographGrade: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .describe("Autograph grade if applicable"),
  }),

  // Player Information
  player: z.object({
    name: z.string().describe("Full name of the player"),
    team: z.string().describe("Team name at the time of the card"),
    position: z.string().optional().describe("Player position"),
  }),

  // Card Details
  card: z.object({
    year: z.number().describe("Year the card was produced"),
    brand: z
      .string()
      .describe("Card manufacturer (e.g., Topps, Panini, Upper Deck)"),
    setName: z.string().describe("Card set name"),
    cardNumber: z.string().describe("Card number within the set"),
    variant: z
      .string()
      .optional()
      .describe("Card variant (e.g., Rookie Card, Refractor, Prizm)"),
    cardType: z
      .string()
      .optional()
      .describe("Type of card (Base, Insert, Parallel, etc.)"),
    serialNumber: z
      .string()
      .optional()
      .describe("Serial number if numbered card"),
    autographed: z.boolean().describe("Whether the card is autographed"),
    rookie: z.boolean().describe("Whether this is a rookie card"),
  }),

  // Additional Information
  metadata: z.object({
    sport: z.literal("NBA").describe("Sport type"),
    estimatedValue: z
      .string()
      .optional()
      .describe("Estimated market value if identifiable"),
    rarity: z
      .enum(["Common", "Uncommon", "Rare", "Very Rare", "Extremely Rare"])
      .optional()
      .describe("Card rarity"),
    description: z
      .string()
      .optional()
      .describe("Additional notable features or description"),
  }),
});

export type PSACard = z.infer<typeof PSACardSchema>;

// Certification result schema
export const certificationResultSchema = z.object({
  isValid: z.boolean(),
  certificationNumber: z.string().optional(),
  details: z.any().optional(),
});

export type CertificationResult = z.infer<typeof certificationResultSchema>;

// Extended PSACard with certification
export type PSACardWithCertification = PSACard & {
  certification?: CertificationResult;
};

// Error response schema
export const errorSchema = z.object({
  error: z.literal("image_not_supported"),
  reason: z.string(),
});

export type ErrorResponse = z.infer<typeof errorSchema>;

export const searchCardsResponseSchema = z.object({
  query: z.string().optional(),
  parameters: z.object({
    textWeight: z.number().optional(),
    imageWeight: z.number().optional(),
    topK: z.number().optional(),
    filters: z.record(z.string(), z.any()).optional(),
  }),
  resultCount: z.number(),
  results: z.array(
    z.object({
      cardId: z.string(),
      scores: z.object({
        text: z.number(),
        image: z.number(),
        combined: z.number(),
      }),
      card: z.array(PSACardSchema),
    })
  ),
});

export type SearchCardsResponse = z.infer<typeof searchCardsResponseSchema>;
