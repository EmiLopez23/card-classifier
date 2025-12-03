"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, Search, Loader2 } from "lucide-react";
import { useQueryState } from "nuqs";
import UploadTab from "@/components/tabs/upload";
import { Suspense } from "react";
import SearchTab from "@/components/tabs/search";

export function Home() {
  const [tab, setTab] = useQueryState("upload", {
    defaultValue: "upload",
  });

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
        <TabsContent
          value="upload"
          className="h-full flex flex-col gap-4 items-end"
        >
          <UploadTab />
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="flex flex-col gap-4">
          <SearchTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Wrap the Home component in a suspense boundary to prevent hydration errors and build errors
export default function HomePage() {
  return (
    <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin" />}>
      <Home />
    </Suspense>
  );
}
