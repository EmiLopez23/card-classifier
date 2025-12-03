import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { CardAnalysisStateType } from "./types";
import { createError, withErrorHandling } from "./helpers";
import { createCardTextDescription } from "@/lib/embeddings";
import { TavilyClient } from "tavily";

/**
 * Generate rich card description with optional web search enhancement
 *
 * @param state - Current agent state
 * @returns Updated state with description and web search results
 */
export async function describeCard(
  state: CardAnalysisStateType
): Promise<Partial<CardAnalysisStateType>> {
  console.log("TOOL CALLED:Describing card");
  const card = state.validatedCard;
  if (!card) {
    return createError("No validated card available");
  }

  // Create base description from card data
  const baseDescription = createCardTextDescription(card);

  // Optionally search web for additional information
  let webSearchResults: any[] = [];
  let enhancedDescription = baseDescription;

  try {
    if (!process.env.TAVILY_API_KEY || !card.player.name) {
      throw new Error("Tavily API key or player name is not set");
    }
    const searchQuery = `${card.player.name} ${card.card.year} ${card.card.brand} ${card.card.setName} NBA card value statistics`;

    const tavilyClient = new TavilyClient({
      apiKey: process.env.TAVILY_API_KEY,
    });

    const tavilyResponse = await tavilyClient.search({
      query: searchQuery,
      include_answer: true,
      include_images: false,
      search_depth: "advanced",
      max_results: 5,
    });

    webSearchResults = tavilyResponse.results || [];

    // Generate enhanced description using LLM with web search results
    const model = google("gemini-2.5-flash");
    const enhancementPrompt = `You are a sports card expert. Create a rich, collector-friendly description for this card.

    Card Information:
    ${baseDescription}

    Additional Web Search Results:
    ${webSearchResults.map((r: any) => `- ${r.title}: ${r.content}`).join("\n")}

    Create a compelling 2-3 paragraph description that includes:
    1. Player background and significance
    2. Card details and rarity
    3. Market value insights (if available)
    4. Collectibility factors

    Keep it concise but informative.`;

    const result = await generateText({
      model,
      prompt: enhancementPrompt,
    });

    enhancedDescription = result.text;
  } catch (searchError) {
    console.log("Web search failed or skipped:", searchError);
    // Continue with base description if web search fails
  }

  return {
    description: enhancedDescription,
    webSearchResults,
    currentStep: "embeddings",
  };
}

/**
 * Describe tool with error handling wrapper
 */
export const describeCardTool = withErrorHandling(
  describeCard,
  "Description generation failed"
);
