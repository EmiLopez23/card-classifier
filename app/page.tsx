"use client";

import { useState } from "react";
import { useCardAnalyzer } from "@/hooks";
import { toast } from "sonner";
import UploadCard from "@/components/upload-card";
import ResultCard from "@/components/result-card";

export default function Home() {
  const [files, setFiles] = useState<File[] | undefined>();
  const { isAnalyzing, items, enqueue, clear } = useCardAnalyzer();

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    // new selection resets previous results
    clear();
  };

  const handleError = (error: Error) => {
    toast.error(error.message);
  };

  const handleSubmit = async () => {
    if (!files || files.length === 0) return;
    enqueue(files);
    setFiles(undefined);
  };

  return (
    <div className="min-h-screen px-4 py-12 flex flex-col gap-4">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-6xl">
          Card Classifier
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Upload your PSA certified NBA card for intelligent classification and
          analysis
        </p>
      </div>
      <div className="gap-4 flex-1 grid grid-cols-2">
        {/* Upload Card */}

        <UploadCard
          files={files}
          isAnalyzing={isAnalyzing}
          handleDrop={handleDrop}
          handleError={handleError}
          handleSubmit={handleSubmit}
        />
        <div className="flex flex-col gap-3">
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
                  {item.status === "pending" && "Queued"}
                  {item.status === "processing" && "Processing"}
                  {item.status === "done" && "Completed"}
                  {item.status === "error" && "Error"}
                </p>
              </div>
              <ResultCard
                result={item.result}
                error={item.error}
                loading={item.status === "processing"}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
