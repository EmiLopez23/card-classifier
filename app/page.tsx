"use client";

import { useState } from "react";
import { useCardAnalyzer } from "@/hooks";
import { toast } from "sonner";
import UploadCard from "@/components/upload-card";
import ResultCard from "@/components/result-card";

export default function Home() {
  const [files, setFiles] = useState<File[] | undefined>();
  const [filePreview, setFilePreview] = useState<string | undefined>();
  const { isAnalyzing, result, error, analyze, reset } = useCardAnalyzer();

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    reset();

    // Create preview for images
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === "string") {
            setFilePreview(e.target.result);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(undefined);
      }
    }
  };

  const handleError = (error: Error) => {
    toast.error(error.message);
  };

  const handleSubmit = async () => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    formData.append("file", files[0]);
    await analyze(formData);
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
          filePreview={filePreview}
          isAnalyzing={isAnalyzing}
          handleDrop={handleDrop}
          handleError={handleError}
          handleSubmit={handleSubmit}
        />
        <ResultCard result={result} error={error} loading={isAnalyzing} />
      </div>
    </div>
  );
}
