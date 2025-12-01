"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Search, Loader2, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface CardSearchProps {
  onSearch: (query: string, filters: SearchFilters, weights: { text: number; image: number }) => void;
  isSearching: boolean;
}

export default function CardSearch({ onSearch, isSearching }: CardSearchProps) {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [textWeight, setTextWeight] = useState(0.5);
  const [imageWeight, setImageWeight] = useState(0.5);
  
  const [filters, setFilters] = useState<SearchFilters>({});

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query, filters, { text: textWeight, image: imageWeight });
  };

  const clearFilters = () => {
    setFilters({});
    setTextWeight(0.5);
    setImageWeight(0.5);
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || textWeight !== 0.5 || imageWeight !== 0.5;

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
        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search for cards (e.g., LeBron James rookie, high grade basketball)..."
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
            <div className="border rounded-lg p-4 space-y-4 bg-neutral-50 dark:bg-neutral-900">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Search Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              {/* Search Weights */}
              <div className="space-y-3 border-b pb-4">
                <h5 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Search Type
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="textWeight" className="text-xs">
                        Text Weight
                      </Label>
                      <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        {textWeight.toFixed(1)}
                      </span>
                    </div>
                    <input
                      id="textWeight"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={textWeight}
                      onChange={(e) => setTextWeight(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-neutral-500">
                      Semantic search (meaning-based)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="imageWeight" className="text-xs">
                        Image Weight
                      </Label>
                      <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        {imageWeight.toFixed(1)}
                      </span>
                    </div>
                    <input
                      id="imageWeight"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={imageWeight}
                      onChange={(e) => setImageWeight(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-neutral-500">
                      Visual similarity
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Filters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="player" className="text-xs">
                    Player Name
                  </Label>
                  <Input
                    id="player"
                    type="text"
                    placeholder="e.g., LeBron James"
                    value={filters.player || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, player: e.target.value || undefined })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-xs">
                    Brand
                  </Label>
                  <Input
                    id="brand"
                    type="text"
                    placeholder="e.g., Topps"
                    value={filters.brand || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, brand: e.target.value || undefined })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Grade Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minGrade" className="text-xs">
                    Min Grade
                  </Label>
                  <Input
                    id="minGrade"
                    type="number"
                    min="1"
                    max="10"
                    placeholder="1-10"
                    value={filters.minGrade || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minGrade: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGrade" className="text-xs">
                    Max Grade
                  </Label>
                  <Input
                    id="maxGrade"
                    type="number"
                    min="1"
                    max="10"
                    placeholder="1-10"
                    value={filters.maxGrade || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        maxGrade: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Year Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minYear" className="text-xs">
                    Min Year
                  </Label>
                  <Input
                    id="minYear"
                    type="number"
                    placeholder="e.g., 2000"
                    value={filters.minYear || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minYear: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxYear" className="text-xs">
                    Max Year
                  </Label>
                  <Input
                    id="maxYear"
                    type="number"
                    placeholder="e.g., 2023"
                    value={filters.maxYear || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        maxYear: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Boolean Filters */}
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.rookie || false}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        rookie: e.target.checked ? true : undefined,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Rookie Cards Only</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.autographed || false}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        autographed: e.target.checked ? true : undefined,
                      })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Autographed Only</span>
                </label>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

