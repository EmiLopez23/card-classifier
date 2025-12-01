"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Search, Loader2, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchFilters, SearchWeights } from "@/types/search";
import { SEARCH_DEFAULTS, SEARCH_PLACEHOLDERS } from "@/constants/search";
import { SearchFiltersPanel } from "./search/search-filters";

interface CardSearchProps {
  onSearch: (query: string, filters: SearchFilters, weights: SearchWeights) => void;
  isSearching: boolean;
}

export default function CardSearch({ onSearch, isSearching }: CardSearchProps) {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [weights, setWeights] = useState<SearchWeights>({
    text: SEARCH_DEFAULTS.TEXT_WEIGHT,
    image: SEARCH_DEFAULTS.IMAGE_WEIGHT,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query, filters, weights);
  };

  const clearFilters = () => {
    setFilters({});
    setWeights({
      text: SEARCH_DEFAULTS.TEXT_WEIGHT,
      image: SEARCH_DEFAULTS.IMAGE_WEIGHT,
    });
  };

  const hasActiveFilters =
    Object.keys(filters).length > 0 ||
    weights.text !== SEARCH_DEFAULTS.TEXT_WEIGHT ||
    weights.image !== SEARCH_DEFAULTS.IMAGE_WEIGHT;

  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Search Cards</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(hasActiveFilters && "border-blue-500 text-blue-600")}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder={SEARCH_PLACEHOLDERS.QUERY}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isSearching || !query.trim()}>
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <SearchFiltersPanel
              filters={filters}
              weights={weights}
              onFiltersChange={setFilters}
              onWeightsChange={setWeights}
              onClear={clearFilters}
            />
          )}
        </form>
      </CardContent>
    </Card>
  );
}
