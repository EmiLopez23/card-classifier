import { END } from "@langchain/langgraph";
import { CardAnalysisStateType } from "./types";

/**
 * Helper: Create error state
 */
export const createError = (
  reason: string,
  step: "error" = "error"
): Partial<CardAnalysisStateType> => ({
  error: { error: "image_not_supported" as const, reason },
  currentStep: step,
});

/**
 * Helper: Wrap async function with error handling
 */
export const withErrorHandling = (
  fn: (state: CardAnalysisStateType) => Promise<Partial<CardAnalysisStateType>>,
  errorContext: string
) => {
  return async (
    state: CardAnalysisStateType
  ): Promise<Partial<CardAnalysisStateType>> => {
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

/**
 * Helper: Route to next node or END
 */
export const routeToNext = (state: CardAnalysisStateType, nextStep: string) => {
  if (state.currentStep === "error" || state.error) return END;
  return nextStep;
};
