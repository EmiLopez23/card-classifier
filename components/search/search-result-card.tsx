"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { SearchResult } from "@/types/search";
import { formatScore } from "@/lib/search-utils";

interface SearchResultCardProps {
  result: SearchResult;
  rank: number;
}

export function SearchResultCard({ result, rank }: SearchResultCardProps) {
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
                      {formatScore(scores.combined)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Text: </span>
                    <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                      {formatScore(scores.text)}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 dark:text-neutral-400">Image: </span>
                    <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100">
                      {formatScore(scores.image)}
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

