"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCardAnalyzer, useCardSearch } from "@/hooks";
import { SearchFilters, SearchWeights } from "@/types/search";
import UploadCard from "@/components/upload-card";
import ResultCard from "@/components/result-card";
import CardSearch from "@/components/card-search";
import SearchResults from "@/components/search-results";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Search } from "lucide-react";
import { useQueryState } from "nuqs";

export default function Home() {
  const [files, setFiles] = useState<File[] | undefined>();
  const [tab, setTab] = useQueryState("upload", {
    defaultValue: "upload",
  });
  const { isAnalyzing, items, enqueue, clear } = useCardAnalyzer();
  const {
    search,
    isSearching,
    results,
    error: searchError,
    lastQuery,
  } = useCardSearch();

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    clear(); // Reset previous results
  };

  const handleError = (error: Error) => {
    toast.error(error.message);
  };

  const handleSubmit = async () => {
    if (!files || files.length === 0) return;
    enqueue(files);
    setFiles(undefined);
    toast.success("Card uploaded! Wait 10+ seconds before searching.");
  };

  const handleSearch = async (
    query: string,
    filters: SearchFilters,
    weights: SearchWeights
  ) => {
    await search(query, filters, weights);
    if (searchError) {
      toast.error(searchError);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 flex flex-col gap-6">
      {/* Hero Section */}
      <header className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-6xl">
          Card Classifier
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Upload your PSA certified NBA card for intelligent classification and
          search similar cards using multimodal RAG
        </p>
      </header>

      {/* Tabs Section */}
      <Tabs value={tab} onValueChange={setTab} className="w-full flex-1">
        <div className="flex justify-center mb-2">
          <TabsList>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Upload Tab */}
        <TabsContent value="upload" className="gap-4 grid grid-cols-2 h-full">
          {/* Upload Card */}
          <UploadCard
            files={files}
            isAnalyzing={isAnalyzing}
            handleDrop={handleDrop}
            handleError={handleError}
            handleSubmit={handleSubmit}
          />

          {/* Upload Results */}
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
          </div>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="flex flex-col gap-4">
          {/* Search Input */}
          <CardSearch onSearch={handleSearch} isSearching={isSearching} />

          {/* Search Results */}
          <div className="flex flex-col">
            <SearchResults
              results={results}
              loading={isSearching}
              query={lastQuery}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
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
