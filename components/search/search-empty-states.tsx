"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Loader2, SearchX } from "lucide-react";
import { formatScore } from "@/lib/search-utils";

type EmptyStateVariant = "loading" | "empty" | "no-results" | "low-relevance";

interface SearchEmptyStateProps {
  variant: EmptyStateVariant;
  query?: string;
  bestScore?: number;
}

export function SearchEmptyState({ variant, query, bestScore }: SearchEmptyStateProps) {
  const content = getEmptyStateContent(variant, query, bestScore);

  return (
    <Card className="shadow-none">
      <CardContent className="flex-1 items-center justify-center flex flex-col gap-2 py-12">
        {content}
      </CardContent>
    </Card>
  );
}

function getEmptyStateContent(
  variant: EmptyStateVariant,
  query?: string,
  bestScore?: number
) {
  switch (variant) {
    case "loading":
      return (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-neutral-600 dark:text-neutral-400" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Searching cards...
          </p>
        </>
      );

    case "no-results":
      return (
        <>
          <SearchX className="size-8 text-neutral-600 dark:text-neutral-400" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">
              No cards found
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Try adjusting your search query or filters
            </p>
          </div>
        </>
      );

    case "low-relevance":
      return (
        <>
          <SearchX className="size-8 text-yellow-600 dark:text-yellow-400" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              No relevant matches found
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md">
              The search returned results, but they don&apos;t seem very relevant to &quot;{query}&quot;
              {bestScore !== undefined && ` (best match: ${formatScore(bestScore)})`}
            </p>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                💡 <strong>Tip:</strong> Try being more specific with your search. Instead of just &quot;{query}&quot;,
                try searching for combinations like &quot;{query} rookie&quot; or &quot;{query} PSA 10&quot;.
              </p>
            </div>
          </div>
        </>
      );

    case "empty":
    default:
      return (
        <>
          <SearchX className="size-8 text-neutral-600 dark:text-neutral-400" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">
              Search for cards
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Enter a query to find similar cards in your collection
            </p>
          </div>
        </>
      );
  }
}
