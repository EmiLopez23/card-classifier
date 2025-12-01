# Search Functionality Refactoring

## Overview

This document outlines the refactoring of the card search functionality to improve code organization, maintainability, and follow frontend best practices.

## New Structure

```
card-classifier/
├── types/
│   └── search.ts                    # Shared TypeScript types
├── constants/
│   └── search.ts                    # Search-related constants
├── lib/
│   └── search-utils.ts              # Search utility functions
├── hooks/
│   ├── use-card-search.ts           # Refactored search hook
│   └── index.ts                     # Barrel export
├── components/
│   ├── search/
│   │   ├── search-result-card.tsx   # Individual result card component
│   │   ├── search-empty-states.tsx  # Empty state components
│   │   ├── search-filters.tsx       # Filters panel component
│   │   └── index.ts                 # Barrel export
│   ├── card-search.tsx              # Main search component
│   └── search-results.tsx           # Results list component
└── app/
    └── page.tsx                     # Main page (updated imports)
```

## Key Improvements

### 1. **Type Safety & Reusability**

**Before:** Types duplicated across multiple files
```typescript
// In use-card-search.ts
interface SearchFilters { ... }
// In card-search.tsx
interface SearchFilters { ... } // Duplicate!
```

**After:** Centralized type definitions
```typescript
// types/search.ts
export interface SearchFilters { ... }
export interface SearchWeights { ... }
export interface SearchResult { ... }
```

### 2. **Constants Management**

**Before:** Magic numbers scattered throughout code
```typescript
const textWeight = 0.5;
const lowScore = 0.25;
const topK = 10;
```

**After:** Centralized constants with semantic names
```typescript
// constants/search.ts
export const SEARCH_DEFAULTS = {
  TEXT_WEIGHT: 0.5,
  IMAGE_WEIGHT: 0.5,
  TOP_K: 10,
} as const;

export const SCORE_THRESHOLDS = {
  LOW_SCORE: 0.25,
  LOW_SCORE_SHORT_QUERY: 0.20,
  // ...
} as const;
```

### 3. **Utility Functions**

**Before:** Complex logic embedded in components/hooks
```typescript
// Inside useCardSearch
const cleanQuery = query.replace(/[\s-]/g, "");
const isPSACertNumber = /^\d{6,}$/.test(cleanQuery);
// ... 50+ lines of filter building logic
```

**After:** Extracted, testable utility functions
```typescript
// lib/search-utils.ts
export function isPSACertNumber(query: string): boolean { ... }
export function cleanPSACertNumber(query: string): string { ... }
export function buildPineconeFilters(...): Record<string, any> { ... }
export function formatScore(score: number): string { ... }
```

### 4. **Component Decomposition**

**Before:** Monolithic 260+ line components
```typescript
// search-results.tsx - 260 lines
function SearchResults() {
  // Loading state
  // Empty state
  // Error state
  // Results list
  // Individual result card (nested component)
}
```

**After:** Focused, single-responsibility components
```typescript
// search-results.tsx - 60 lines (orchestrator)
// search/search-result-card.tsx - 90 lines (one responsibility)
// search/search-empty-states.tsx - 80 lines (states only)
// search/search-filters.tsx - 150 lines (filters only)
```

### 5. **Improved Import Structure**

**Before:**
```typescript
import { SearchFilters } from "@/hooks/use-card-search";
// Types mixed with logic
```

**After:**
```typescript
import { SearchFilters, SearchWeights, SearchResult } from "@/types/search";
import { SEARCH_DEFAULTS } from "@/constants/search";
import { buildPineconeFilters } from "@/lib/search-utils";
// Clear separation of concerns
```

## Benefits

### For Developers

1. **Better IntelliSense:** Centralized types improve autocomplete
2. **Easier Testing:** Extracted utilities can be unit tested
3. **Faster Navigation:** Smaller, focused files are easier to find and understand
4. **Reduced Duplication:** Shared types and utilities prevent copy-paste errors

### For Maintainability

1. **Single Source of Truth:** Constants defined once, used everywhere
2. **Easier Refactoring:** Changes to types propagate automatically
3. **Clear Dependencies:** Import structure shows what depends on what
4. **Better Git Diffs:** Smaller files = clearer diffs in PRs

### For Performance

1. **Tree Shaking:** Barrel exports enable better dead code elimination
2. **Code Splitting:** Smaller components can be lazy-loaded if needed
3. **Memoization:** Focused components are easier to optimize with React.memo

## Migration Guide

If you're working on a feature that uses the old structure:

1. **Import types from `types/search.ts`**
   ```typescript
   import { SearchFilters, SearchWeights } from "@/types/search";
   ```

2. **Use constants from `constants/search.ts`**
   ```typescript
   import { SEARCH_DEFAULTS, SCORE_THRESHOLDS } from "@/constants/search";
   ```

3. **Use utilities from `lib/search-utils.ts`**
   ```typescript
   import { isPSACertNumber, formatScore } from "@/lib/search-utils";
   ```

4. **Import sub-components from `components/search/`**
   ```typescript
   import { SearchResultCard, SearchFiltersPanel } from "@/components/search";
   ```

## Design Patterns Used

1. **Container/Presentational Pattern**
   - `card-search.tsx` & `search-results.tsx` = Containers (logic)
   - `search/` components = Presentational (UI)

2. **Single Responsibility Principle**
   - Each component has one clear purpose
   - Utilities handle one specific task

3. **DRY (Don't Repeat Yourself)**
   - Shared types, constants, and utilities
   - Reusable components

4. **Composition Over Inheritance**
   - Small components compose into larger ones
   - No class hierarchies

## Future Improvements

Potential areas for further refactoring:

1. **Add unit tests** for `search-utils.ts` functions
2. **Extract API client** for search endpoint calls
3. **Add React.memo** to expensive components
4. **Implement virtualization** for long result lists
5. **Add error boundaries** around search components

## Questions?

For questions about this refactoring, refer to:
- The inline comments in each file
- TypeScript types for function signatures
- This document for architectural decisions

