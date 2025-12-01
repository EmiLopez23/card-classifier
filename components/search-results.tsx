"use client";

import { SearchResult } from "@/types/search";
import { SCORE_THRESHOLDS } from "@/constants/search";
import { isShortQuery } from "@/lib/search-utils";
import { SearchResultCard } from "./search/search-result-card";
import { SearchEmptyState } from "./search/search-empty-states";

interface SearchResultsProps {
  results: SearchResult[] | null;
  loading: boolean;
  query: string;
}

export default function SearchResults({ results, loading, query }: SearchResultsProps) {
  // Loading state
  if (loading) {
    return <SearchEmptyState variant="loading" />;
  }

  // No results state
  if (!results || results.length === 0) {
    const variant = query ? "no-results" : "empty";
    return <SearchEmptyState variant={variant} query={query} />;
  }

  // Check for low relevance
  const bestScore = results[0]?.scores.combined || 0;
  const secondScore = results[1]?.scores.combined || 0;
  const scoreGap = bestScore - secondScore;
  
  // Determine thresholds based on query length
  const isShort = isShortQuery(query);
  const lowScoreThreshold = isShort 
    ? SCORE_THRESHOLDS.LOW_SCORE_SHORT_QUERY 
    : SCORE_THRESHOLDS.LOW_SCORE;
  const lowScoreNoWinnerThreshold = isShort 
    ? SCORE_THRESHOLDS.LOW_SCORE_NO_WINNER_SHORT_QUERY 
    : SCORE_THRESHOLDS.LOW_SCORE_NO_WINNER;
  
  const hasVeryLowScore = bestScore < lowScoreThreshold;
  const hasLowScoreNoWinner = bestScore < lowScoreNoWinnerThreshold && 
                               scoreGap < SCORE_THRESHOLDS.SCORE_GAP_THRESHOLD;
  
  // Low relevance state
  if (hasVeryLowScore || hasLowScoreNoWinner) {
    return <SearchEmptyState variant="low-relevance" query={query} bestScore={bestScore} />;
  }

  // Results list
  return (
    <div className="space-y-3">
      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Found {results.length} {results.length === 1 ? "card" : "cards"}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Sorted by relevance
        </p>
      </div>

      {/* Results List */}
      {results.map((result, index) => (
        <SearchResultCard key={result.cardId} result={result} rank={index + 1} />
      ))}
    </div>
  );
}
