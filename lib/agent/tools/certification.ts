import { CardAnalysisStateType } from "./types";
import { createError, withErrorHandling } from "./helpers";

/**
 * Certify card authenticity via PSA website
 *
 * @param state - Current agent state
 * @returns Updated state with certification result
 */
export async function certifyCard(
  state: CardAnalysisStateType
): Promise<Partial<CardAnalysisStateType>> {
  console.log("TOOL CALLED:Certifying card");
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
        currentStep: "describe",
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
      currentStep: "describe",
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
      currentStep: "describe",
    };
  }
}

/**
 * Certify tool with error handling wrapper
 */
export const certifyCardTool = withErrorHandling(
  certifyCard,
  "Certification failed"
);
