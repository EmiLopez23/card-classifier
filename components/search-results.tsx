"use client";

import { Card, CardContent } from "./ui/card";
import { Loader2, SearchX, TrendingUp } from "lucide-react";

interface SearchResult {
  cardId: string;
  scores: {
    text: number;
    image: number;
    combined: number;
  };
  card: {
    player: {
      name: string;
      team: string;
      position?: string;
    };
    card: {
      year: number;
      brand: string;
      setName: string;
      cardNumber: string;
      rookie: boolean;
      autographed: boolean;
      variant?: string;
    };
    psa: {
      grade: number;
      gradeLabel: string;
      certificationNumber: string;
    };
    textDescription: string;
    timestamp: string;
  };
}

interface SearchResultsProps {
  results: SearchResult[] | null;
  loading: boolean;
  query: string;
}

export default function SearchResults({ results, loading, query }: SearchResultsProps) {
  if (loading) {
    return (
      <Card className="shadow-none">
        <CardContent className="flex-1 items-center justify-center flex flex-col gap-2 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-600 dark:text-neutral-400" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Searching cards...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    if (query) {
      return (
        <Card className="shadow-none">
          <CardContent className="flex-1 items-center justify-center flex flex-col gap-2 py-12">
            <SearchX className="size-8 text-neutral-600 dark:text-neutral-400" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">
                No cards found
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Try adjusting your search query or filters
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="shadow-none">
        <CardContent className="flex-1 items-center justify-center flex flex-col gap-2 py-12">
          <SearchX className="size-8 text-neutral-600 dark:text-neutral-400" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">
              Search for cards
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Enter a query to find similar cards in your collection
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if best result has very low score (< 25%)
  // AND there's no clear winner (best score is not significantly better than second)
  const bestScore = results[0]?.scores.combined || 0;
  const secondScore = results[1]?.scores.combined || 0;
  const scoreGap = bestScore - secondScore;
  
  // For single-word or short queries, lower the threshold
  const isShortQuery = query.trim().split(/\s+/).length <= 2 && query.trim().length <= 20;
  const lowScoreThreshold = isShortQuery ? 0.20 : 0.25;
  const lowScoreNoWinnerThreshold = isShortQuery ? 0.30 : 0.35;
  
  // Show "no relevant matches" only if:
  // 1. Best score is very low (< threshold), OR
  // 2. Best score is low (< higher threshold) AND there's no clear winner (gap < 10%)
  const hasVeryLowScore = bestScore < lowScoreThreshold;
  const hasLowScoreNoWinner = bestScore < lowScoreNoWinnerThreshold && scoreGap < 0.1;
  
  if (hasVeryLowScore || hasLowScoreNoWinner) {
    return (
      <Card className="shadow-none">
        <CardContent className="flex-1 items-center justify-center flex flex-col gap-4 py-12">
          <SearchX className="size-8 text-yellow-600 dark:text-yellow-400" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              No relevant matches found
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md">
              The search returned results, but they don&apos;t seem very relevant to &quot;{query}&quot;
              (best match: {(bestScore * 100).toFixed(1)}%)
            </p>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-neutral-700 dark:text-neutral-300">
                💡 <strong>Tip:</strong> Try being more specific with your search. Instead of just &quot;{query}&quot;, try searching for combinations like &quot;{query} rookie&quot; or &quot;{query} PSA 10&quot;.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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

function SearchResultCard({ result, rank }: { result: SearchResult; rank: number }) {
  const { card, scores } = result;

  return (
    <Card className="shadow-none hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Rank Badge */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                {rank}
              </span>
            </div>
          </div>

          {/* Card Information */}
          <div className="flex-1 space-y-3">
            {/* Player & Card Info */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {card.player.name}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {card.card.year} {card.card.brand} {card.card.setName} #{card.card.cardNumber}
              </p>
              <div className="flex gap-2 mt-2">
                {card.card.rookie && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    Rookie
                  </span>
                )}
                {card.card.autographed && (
                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                    Auto
                  </span>
                )}
                <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                  PSA {card.psa.grade}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-neutral-500 dark:text-neutral-400">Team</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {card.player.team}
                </p>
              </div>
              {card.player.position && (
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400">Position</p>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {card.player.position}
                  </p>
                </div>
              )}
              <div>
                <p className="text-neutral-500 dark:text-neutral-400">Grade</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {card.psa.gradeLabel}
                </p>
              </div>
            </div>

            {/* Similarity Scores */}
            <div className="border-t pt-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    Match Score:
                  </span>
                </div>
                <div className="flex gap-3 text-xs">
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Combined: </span>
                    <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                      {(scores.combined * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Text: </span>
                    <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                      {(scores.text * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Image: </span>
                    <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                      {(scores.image * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

