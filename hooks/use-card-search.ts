import { useState } from "react";

interface SearchFilters {
  minGrade?: number;
  maxGrade?: number;
  rookie?: boolean;
  autographed?: boolean;
  minYear?: number;
  maxYear?: number;
  player?: string;
  brand?: string;
}

interface SearchWeights {
  text: number;
  image: number;
}

interface SearchResult {
  cardId: string;
  scores: {
    text: number;
    image: number;
    combined: number;
  };
  card: any;
}

export function useCardSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");

  const search = async (
    query: string,
    filters: SearchFilters = {},
    weights: SearchWeights = { text: 0.5, image: 0.5 }
  ) => {
    setIsSearching(true);
    setError(null);
    setLastQuery(query);

    try {
      // Build filter object for Pinecone
      const pineconeFilters: any = {};

      // Auto-detect PSA certification number search
      // If query is a number (with optional spaces/dashes), treat as cert number search
      const cleanQuery = query.replace(/[\s-]/g, "");
      const isPSACertNumber = /^\d{6,}$/.test(cleanQuery);
      
      if (isPSACertNumber) {
        // Exact match on PSA cert number using Pinecone $eq operator
        pineconeFilters.psa_cert_number = { $eq: cleanQuery };
        console.log(`Detected PSA cert number search: ${cleanQuery}`);
      }

      if (filters.minGrade !== undefined || filters.maxGrade !== undefined) {
        if (filters.minGrade !== undefined && filters.maxGrade !== undefined) {
          pineconeFilters.psa_grade = {
            $gte: filters.minGrade,
            $lte: filters.maxGrade,
          };
        } else if (filters.minGrade !== undefined) {
          pineconeFilters.psa_grade = { $gte: filters.minGrade };
        } else if (filters.maxGrade !== undefined) {
          pineconeFilters.psa_grade = { $lte: filters.maxGrade };
        }
      }

      if (filters.minYear !== undefined || filters.maxYear !== undefined) {
        if (filters.minYear !== undefined && filters.maxYear !== undefined) {
          pineconeFilters.card_year = {
            $gte: filters.minYear,
            $lte: filters.maxYear,
          };
        } else if (filters.minYear !== undefined) {
          pineconeFilters.card_year = { $gte: filters.minYear };
        } else if (filters.maxYear !== undefined) {
          pineconeFilters.card_year = { $lte: filters.maxYear };
        }
      }

      if (filters.rookie !== undefined) {
        pineconeFilters.card_rookie = filters.rookie;
      }

      if (filters.autographed !== undefined) {
        pineconeFilters.card_autographed = filters.autographed;
      }

      if (filters.player) {
        pineconeFilters.player_name = filters.player;
      }

      if (filters.brand) {
        pineconeFilters.card_brand = filters.brand;
      }

      const requestBody: any = {
        query,
        textWeight: weights.text,
        imageWeight: weights.image,
        topK: 10,
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

