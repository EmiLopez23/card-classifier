import { CardAnalysisStateType } from "./types";
import { createError, withErrorHandling } from "./helpers";
import { PSACardSchema } from "@/lib/schemas";

/**
 * Validate that the extracted card is an NBA card with required fields
 *
 * @param state - Current agent state
 * @returns Updated state with validated card or error
 */
export async function validateNBACard(
  state: CardAnalysisStateType
): Promise<Partial<CardAnalysisStateType>> {
  console.log("TOOL CALLED:Validating card");
  const info = state.extractedInfo;
  if (!info) {
    return createError("No extracted information available");
  }

  // Validate NBA sport
  if (info.metadata?.sport !== "NBA") {
    return createError(
      `Card is not an NBA card. Detected sport: ${
        info.metadata?.sport || "unknown"
      }`
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
}

/**
 * Validate tool with error handling wrapper
 */
export const validateNBACardTool = withErrorHandling(
  validateNBACard,
  "Validation failed"
);
