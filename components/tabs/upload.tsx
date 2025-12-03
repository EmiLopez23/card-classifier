import { useState } from "react";
import { Button } from "../ui/button";
import { useCardAnalyzer, useCardAnalyzerStream } from "@/hooks";
import { toast } from "sonner";
import UploadCard from "../upload-card";
import AgentStepsVisualizer from "../agent-steps-visualizer";
import ResultCard from "../result-card";

export default function UploadTab() {
  const [files, setFiles] = useState<File[] | undefined>();
  const [hint, setHint] = useState<string>("");
  const [useStreaming, setUseStreaming] = useState(true); // Enable streaming by default

  // Regular analyzer (for backward compatibility)
  const { isAnalyzing, items, enqueue, clear } = useCardAnalyzer();

  // Streaming analyzer
  const {
    analyzeWithStream,
    isAnalyzing: isStreamAnalyzing,
    steps,
    currentStep,
    result: streamResult,
    error: streamError,
    clearSteps,
  } = useCardAnalyzerStream();

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    if (useStreaming) {
      clearSteps(); // Reset streaming steps
    } else {
      clear(); // Reset previous results
    }
  };

  const handleError = (error: Error) => {
    toast.error(error.message);
  };

  const handleSubmit = async () => {
    if (!files || files.length === 0) return;

    if (useStreaming) {
      // Use streaming mode
      await analyzeWithStream(files[0], hint || undefined);
      toast.success("Card uploaded! Wait 10+ seconds before searching.");
    } else {
      // Use regular batch mode
      enqueue(files, hint || undefined);
      toast.success("Card uploaded! Wait 10+ seconds before searching.");
    }

    setFiles(undefined);
    setHint("");
  };

  const isProcessing = useStreaming ? isStreamAnalyzing : isAnalyzing;

  return (
    <>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Button
          variant={useStreaming ? "default" : "outline"}
          size="sm"
          onClick={() => setUseStreaming(true)}
        >
          Streaming Mode
        </Button>
        <Button
          variant={!useStreaming ? "default" : "outline"}
          size="sm"
          onClick={() => setUseStreaming(false)}
        >
          Batch Mode
        </Button>
      </div>
      <div className="gap-4 grid grid-cols-2 w-full flex-1">
        {/* Upload Card */}
        <UploadCard
          files={files}
          isAnalyzing={isProcessing}
          hint={hint}
          onHintChange={setHint}
          handleDrop={handleDrop}
          handleError={handleError}
          handleSubmit={handleSubmit}
        />

        {/* Upload Results */}
        <div className="flex flex-col gap-3">
          {useStreaming ? (
            <>
              {/* Streaming Mode Results */}
              <AgentStepsVisualizer
                steps={steps}
                currentStep={currentStep}
                isAnalyzing={isStreamAnalyzing}
              />
              <ResultCard
                result={streamResult}
                error={streamError}
                loading={isStreamAnalyzing}
              />
            </>
          ) : (
            <>
              {/* Batch Mode Results */}
              {(!items || items.length === 0) && (
                <ResultCard result={null} error={null} loading={false} />
              )}
              {items.map((item) => (
                <div key={item.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {item.fileName}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {getStatusLabel(item.status)}
                    </p>
                  </div>
                  <ResultCard
                    result={item.result}
                    error={item.error}
                    loading={item.status === "processing"}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: "Queued",
    processing: "Processing",
    done: "Completed",
    error: "Error",
  };
  return statusMap[status] || status;
}
