"use client";

import { useState } from "react";
import { Upload, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { useCardAnalyzer } from "@/hooks";
import { toast } from "sonner";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) return;
    const formData = new FormData();
    formData.append("file", files[0]);
    await analyze(formData);
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-black dark:to-neutral-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-6xl">
            Card Classifier
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Upload your PSA certified NBA card for intelligent classification
            and analysis
          </p>
        </div>

        {/* Upload Card */}
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="shadow-lg border-neutral-200 dark:border-neutral-800">
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>
                Drag and drop your PSA certified NBA card image or click to
                browse. Supports images (PNG, JPG, GIF, WEBP) and PDF files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dropzone Component */}
                <Dropzone
                  accept={{
                    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
                    "application/pdf": [".pdf"],
                  }}
                  maxFiles={1}
                  maxSize={1024 * 1024 * 10} // 10MB
                  onDrop={handleDrop}
                  onError={handleError}
                  src={files}
                  className="min-h-[200px]"
                  disabled={isAnalyzing}
                >
                  <DropzoneEmptyState />
                  <DropzoneContent>
                    {files && files.length > 0 && (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        {filePreview ? (
                          <div className="relative w-full h-[150px] rounded-lg overflow-hidden">
                            <img
                              alt="Preview"
                              className="w-full h-full object-contain"
                              src={filePreview}
                            />
                          </div>
                        ) : (
                          <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                            <FileText className="h-12 w-12 text-red-500" />
                          </div>
                        )}
                        <div className="text-center">
                          <p className="font-medium text-sm">{files[0].name}</p>
                          <p className="text-muted-foreground text-xs">
                            Click or drag to replace
                          </p>
                        </div>
                      </div>
                    )}
                  </DropzoneContent>
                </Dropzone>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!files || files.length === 0 || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Card...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Analyze Card
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                      Image Not Supported
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Display */}
          {result && (
            <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <CardTitle className="text-green-900 dark:text-green-100">
                    Valid PSA Card Detected
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PSA Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-neutral-900 dark:text-neutral-100">
                    PSA Certification
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Cert Number
                      </p>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {result.psa.certificationNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Grade
                      </p>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {result.psa.grade} - {result.psa.gradeLabel}
                      </p>
                    </div>
                    {result.psa.autographGrade && (
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Autograph Grade
                        </p>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {result.psa.autographGrade}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Player Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-neutral-900 dark:text-neutral-100">
                    Player
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Name
                      </p>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {result.player.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Team
                      </p>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {result.player.team}
                      </p>
                    </div>
                    {result.player.position && (
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Position
                        </p>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {result.player.position}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-neutral-900 dark:text-neutral-100">
                    Card Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Year
                      </p>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {result.card.year}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Brand
                      </p>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {result.card.brand}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Set
                      </p>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        {result.card.setName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Card Number
                      </p>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100">
                        #{result.card.cardNumber}
                      </p>
                    </div>
                    {result.card.variant && (
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Variant
                        </p>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {result.card.variant}
                        </p>
                      </div>
                    )}
                    {result.card.serialNumber && (
                      <div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Serial Number
                        </p>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {result.card.serialNumber}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Features
                      </p>
                      <div className="flex gap-2 mt-1">
                        {result.card.rookie && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                            Rookie
                          </span>
                        )}
                        {result.card.autographed && (
                          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                            Auto
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                {(result.metadata.rarity ||
                  result.metadata.estimatedValue ||
                  result.metadata.description) && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-neutral-900 dark:text-neutral-100">
                      Additional Info
                    </h3>
                    <div className="space-y-2">
                      {result.metadata.rarity && (
                        <div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Rarity
                          </p>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {result.metadata.rarity}
                          </p>
                        </div>
                      )}
                      {result.metadata.estimatedValue && (
                        <div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Estimated Value
                          </p>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {result.metadata.estimatedValue}
                          </p>
                        </div>
                      )}
                      {result.metadata.description && (
                        <div>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Description
                          </p>
                          <p className="font-medium text-neutral-900 dark:text-neutral-100">
                            {result.metadata.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
