import { useState } from "react";
import { SearchFilters, SearchWeights, SearchResult } from "@/types/search";
import { SEARCH_DEFAULTS } from "@/constants/search";
import { buildPineconeFilters } from "@/lib/search-utils";

interface UseCardSearchReturn {
  search: (query: string, filters?: SearchFilters, weights?: SearchWeights) => Promise<void>;
  isSearching: boolean;
  results: SearchResult[] | null;
  error: string | null;
  lastQuery: string;
  clearResults: () => void;
}

export function useCardSearch(): UseCardSearchReturn {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");

  const search = async (
    query: string,
    filters: SearchFilters = {},
    weights: SearchWeights = {
      text: SEARCH_DEFAULTS.TEXT_WEIGHT,
      image: SEARCH_DEFAULTS.IMAGE_WEIGHT,
    }
  ) => {
    setIsSearching(true);
    setError(null);
    setLastQuery(query);

    try {
      const pineconeFilters = buildPineconeFilters(filters, query);

      const requestBody: any = {
        query,
        textWeight: weights.text,
        imageWeight: weights.image,
        topK: SEARCH_DEFAULTS.TOP_K,
      };

      // Only add filters if there are any
      if (Object.keys(pineconeFilters).length > 0) {
        requestBody.filters = pineconeFilters;
      }

      const response = await fetch("/api/search-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to search cards";
      setError(errorMessage);
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
    setLastQuery("");
  };

  return {
    search,
    isSearching,
    results,
    error,
    lastQuery,
    clearResults,
  };
}
