import { StateGraph, START, END } from "@langchain/langgraph";
import {
  CardAnalysisState,
  CardAnalysisStateType,
  PSACard,
  ErrorResponse,
  extractCardInformationTool,
  validateNBACardTool,
  certifyCardTool,
  describeCardTool,
  generateEmbeddingsTool,
  saveToDatabaseTool,
  routeToNext,
} from "./tools";

export type { CardAnalysisStateType } from "./tools";

/**
 * LangGraph Agent for PSA Card Analysis
 *
 * This agent uses modular tools from the `tools/` folder.
 * Each tool is independent and can be used standalone or within the graph.
 */

/**
 * Create the LangGraph agent with all tools
 *
 * Pipeline: Extract → Validate → Certify → Describe → Embeddings → Save
 *
 * Each tool is modular and can be used independently outside this graph.
 */
export const agent = new StateGraph(CardAnalysisState)
  .addNode("extract", extractCardInformationTool)
  .addNode("validate", validateNBACardTool)
  .addNode("certify", certifyCardTool)
  .addNode("describe", describeCardTool)
  .addNode("embeddings", generateEmbeddingsTool)
  .addNode("save", saveToDatabaseTool)
  .addEdge(START, "extract")
  .addConditionalEdges("extract", (s) => routeToNext(s, "validate"), [
    "validate",
    END,
  ])
  .addConditionalEdges("validate", (s) => routeToNext(s, "certify"), [
    "certify",
    END,
  ])
  .addConditionalEdges("certify", (s) => routeToNext(s, "describe"), [
    "describe",
    END,
  ])
  .addConditionalEdges("describe", (s) => routeToNext(s, "embeddings"), [
    "embeddings",
    END,
  ])
  .addConditionalEdges("embeddings", (s) => routeToNext(s, "save"), [
    "save",
    END,
  ])
  .addEdge("save", END)
  .compile();

/**
 * Main analysis function - runs the full agent pipeline
 *
 * @param imageBase64 - Base64 encoded image data
 * @param mimeType - Image MIME type
 * @param cardId - Unique card identifier
 * @param imageBuffer - Raw image buffer for embeddings
 * @param userHint - Optional user guidance for analysis
 * @returns Complete analysis results or error
 */
export async function executeAnalyzerGraph(
  imageBase64: string,
  mimeType: string,
  cardId: string,
  imageBuffer: Buffer,
  userHint?: string
): Promise<{
  validatedCard?: PSACard;
  certificationResult?: {
    isValid: boolean;
    certificationNumber?: string;
    details?: any;
  };
  description?: string;
  webSearchResults?: any[];
  savedToDatabase?: boolean;
  cardId?: string;
  error?: ErrorResponse;
}> {
  const result = await agent.invoke({
    imageBase64,
    mimeType,
    imageBuffer,
    cardId,
    userHint,
    currentStep: "extract",
  });

  return result.error
    ? { error: result.error }
    : {
        validatedCard: result.validatedCard,
        certificationResult: result.certificationResult,
        description: result.description,
        webSearchResults: result.webSearchResults,
        savedToDatabase: result.savedToDatabase,
        cardId: result.cardId,
      };
}

/**
 * Stream agent execution - yields intermediate results after each tool
 *
 * @param imageBase64 - Base64 encoded image data
 * @param mimeType - Image MIME type
 * @param cardId - Unique card identifier
 * @param imageBuffer - Raw image buffer for embeddings
 * @param userHint - Optional user guidance for analysis
 * @yields Step-by-step updates as each tool executes
 */
export async function* streamAnalyzerGraph(
  imageBase64: string,
  mimeType: string,
  cardId: string,
  imageBuffer: Buffer,
  userHint?: string
) {
  const stream = await agent.stream(
    {
      imageBase64,
      mimeType,
      imageBuffer,
      cardId,
      userHint,
      currentStep: "extract",
    },
    {
      streamMode: "updates", // Get updates after each node execution
    }
  );

  for await (const event of stream) {
    // event contains: { nodeName: { ...stateUpdate } }
    const [nodeName, stateUpdate] = Object.entries(event)[0];

    yield {
      step: nodeName,
      timestamp: new Date().toISOString(),
      data: stateUpdate,
      currentStep: stateUpdate.currentStep,
      error: stateUpdate.error,
    };
  }
}
