"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { SearchFilters, SearchWeights } from "@/types/search";
import {
  SEARCH_DEFAULTS,
  SEARCH_PLACEHOLDERS,
  FILTER_LIMITS,
} from "@/constants/search";

interface SearchFiltersProps {
  filters: SearchFilters;
  weights: SearchWeights;
  onFiltersChange: (filters: SearchFilters) => void;
  onWeightsChange: (weights: SearchWeights) => void;
  onClear: () => void;
}

export function SearchFiltersPanel({
  filters,
  weights,
  onFiltersChange,
  onWeightsChange,
  onClear,
}: SearchFiltersProps) {
  const hasActiveFilters =
    Object.keys(filters).length > 0 ||
    weights.text !== SEARCH_DEFAULTS.TEXT_WEIGHT ||
    weights.image !== SEARCH_DEFAULTS.IMAGE_WEIGHT;

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Search Filters</h4>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
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
          <WeightSlider
            id="textWeight"
            label="Text Weight"
            value={weights.text}
            onChange={(value) =>
              onWeightsChange({ ...weights, text: value, image: 1 - value })
            }
            description="Semantic search (meaning-based)"
          />
          <WeightSlider
            id="imageWeight"
            label="Image Weight"
            value={weights.image}
            onChange={(value) =>
              onWeightsChange({ ...weights, image: value, text: 1 - value })
            }
            description="Visual similarity"
          />
        </div>
      </div>

      {/* Player & Brand Filters */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="player" className="text-xs">
            Player Name
          </Label>
          <Input
            id="player"
            type="text"
            placeholder={SEARCH_PLACEHOLDERS.PLAYER}
            value={filters.player || ""}
            onChange={(e) =>
              updateFilter("player", e.target.value || undefined)
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
            placeholder={SEARCH_PLACEHOLDERS.BRAND}
            value={filters.brand || ""}
            onChange={(e) => updateFilter("brand", e.target.value || undefined)}
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
            min={FILTER_LIMITS.MIN_GRADE}
            max={FILTER_LIMITS.MAX_GRADE}
            placeholder={SEARCH_PLACEHOLDERS.GRADE}
            value={filters.minGrade || ""}
            onChange={(e) =>
              updateFilter(
                "minGrade",
                e.target.value ? parseInt(e.target.value) : undefined
              )
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
            min={FILTER_LIMITS.MIN_GRADE}
            max={FILTER_LIMITS.MAX_GRADE}
            placeholder={SEARCH_PLACEHOLDERS.GRADE}
            value={filters.maxGrade || ""}
            onChange={(e) =>
              updateFilter(
                "maxGrade",
                e.target.value ? parseInt(e.target.value) : undefined
              )
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
            placeholder={SEARCH_PLACEHOLDERS.YEAR}
            value={filters.minYear || ""}
            onChange={(e) =>
              updateFilter(
                "minYear",
                e.target.value ? parseInt(e.target.value) : undefined
              )
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
            placeholder={SEARCH_PLACEHOLDERS.YEAR}
            value={filters.maxYear || ""}
            onChange={(e) =>
              updateFilter(
                "maxYear",
                e.target.value ? parseInt(e.target.value) : undefined
              )
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
              updateFilter("rookie", e.target.checked ? true : undefined)
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
              updateFilter("autographed", e.target.checked ? true : undefined)
            }
            className="rounded"
          />
          <span className="text-sm">Autographed Only</span>
        </label>
      </div>
    </div>
  );
}

interface WeightSliderProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  description: string;
}

function WeightSlider({
  id,
  label,
  value,
  onChange,
  description,
}: WeightSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs">
          {label}
        </Label>
        <span className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
          {value.toFixed(1)}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
      <p className="text-xs text-neutral-500">{description}</p>
    </div>
  );
}
