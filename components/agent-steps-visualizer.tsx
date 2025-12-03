import { AgentStep } from "@/hooks/use-card-analyzer-stream";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  CheckCircle2,
  Loader2,
  Image,
  CheckCircle,
  Search,
  Sparkles,
  FileType,
  Database,
  XCircle,
} from "lucide-react";

const stepIcons: Record<string, any> = {
  extract: Image,
  validate: CheckCircle,
  certify: Search,
  describe: Sparkles,
  embeddings: FileType,
  save: Database,
};

const stepLabels: Record<string, string> = {
  extract: "Extracting Card Info",
  validate: "Validating NBA Card",
  certify: "Certifying with PSA",
  describe: "Generating Description",
  embeddings: "Creating Embeddings",
  save: "Saving to Database",
};

interface AgentStepsVisualizerProps {
  steps: AgentStep[];
  currentStep: string | null;
  isAnalyzing: boolean;
}

export default function AgentStepsVisualizer({
  steps,
  currentStep,
  isAnalyzing,
}: AgentStepsVisualizerProps) {
  if (steps.length === 0 && !isAnalyzing) {
    return null;
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {isAnalyzing ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
          Agent Execution Steps
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = stepIcons[step.step] || CheckCircle2;
            const isActive = currentStep === step.step && isAnalyzing;
            const isComplete = index < steps.length - 1 || !isAnalyzing;
            const hasError = step.error;

            return (
              <div
                key={`${step.step}-${index}`}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  hasError
                    ? "border-red-500 bg-red-50 dark:bg-red-950"
                    : isActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : isComplete
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    hasError
                      ? "bg-red-500 text-white"
                      : isActive
                      ? "bg-blue-500 text-white"
                      : isComplete
                      ? "bg-green-500 text-white"
                      : "bg-neutral-200 dark:bg-neutral-800"
                  }`}
                >
                  {hasError ? (
                    <XCircle className="h-4 w-4" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm">
                      {stepLabels[step.step] || step.step}
                    </h4>
                    <span className="text-xs text-neutral-500 whitespace-nowrap">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Show error message */}
                  {hasError && (
                    <div className="mt-2 text-xs text-red-700 dark:text-red-300">
                      {step.error.reason || "An error occurred"}
                    </div>
                  )}

                  {/* Show intermediate data */}
                  {step.data && Object.keys(step.data).length > 0 && (
                    <div className="mt-2">
                      <details className="group">
                        <summary className="cursor-pointer text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors">
                          View step data
                        </summary>
                        <div className="mt-2 text-xs bg-white dark:bg-neutral-900 p-2 rounded border border-neutral-200 dark:border-neutral-700 overflow-auto max-h-60">
                          <pre className="text-[10px]">
                            {JSON.stringify(
                              {
                                ...step.data,
                                // Hide sensitive/large data
                                imageBase64: step.data.imageBase64
                                  ? "[hidden]"
                                  : undefined,
                                imageBuffer: step.data.imageBuffer
                                  ? "[hidden]"
                                  : undefined,
                                textEmbedding: step.data.textEmbedding
                                  ? `[${step.data.textEmbedding.length} dimensions]`
                                  : undefined,
                                imageEmbedding: step.data.imageEmbedding
                                  ? `[${step.data.imageEmbedding.length} dimensions]`
                                  : undefined,
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      </details>
                    </div>
                  )}
                </div>

                {isComplete && !hasError && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 shrink-0" />
                )}
              </div>
            );
          })}

          {isAnalyzing && steps.length === 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-950">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-sm text-blue-900 dark:text-blue-100">
                Starting agent...
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
