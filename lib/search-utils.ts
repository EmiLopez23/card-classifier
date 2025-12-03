import { SearchFilters } from "@/types/search";
import { FILTER_LIMITS } from "@/constants/search";

/**
 * Detects if a query string is a PSA certification number
 */
export function isPSACertNumber(query: string): boolean {
  const cleanQuery = query.replace(/[\s-]/g, "");
  return new RegExp(`^\\d{${FILTER_LIMITS.PSA_CERT_MIN_LENGTH},}$`).test(cleanQuery);
}

/**
 * Cleans a PSA certification number by removing spaces and dashes
 */
export function cleanPSACertNumber(query: string): string {
  return query.replace(/[\s-]/g, "");
}

/**
 * Checks if a query is considered "short" (single word or short phrase)
 */
export function isShortQuery(query: string): boolean {
  const trimmed = query.trim();
  const wordCount = trimmed.split(/\s+/).length;
  return wordCount <= FILTER_LIMITS.SHORT_QUERY_MAX_WORDS && 
         trimmed.length <= FILTER_LIMITS.SHORT_QUERY_MAX_LENGTH;
}

/**
 * Builds Pinecone filter object from search filters
 */
export function buildPineconeFilters(
  filters: SearchFilters,
  query: string
): Record<string, any> {
  const pineconeFilters: Record<string, any> = {};

  // Auto-detect PSA certification number search
  if (isPSACertNumber(query)) {
    const cleanQuery = cleanPSACertNumber(query);
    pineconeFilters.psa_cert_number = { $eq: cleanQuery };
    console.log(`Detected PSA cert number search: ${cleanQuery}`);
  }

  // Grade filters
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

  // Year filters
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

  // Boolean filters
  if (filters.rookie !== undefined) {
    pineconeFilters.card_rookie = filters.rookie;
  }

  if (filters.autographed !== undefined) {
    pineconeFilters.card_autographed = filters.autographed;
  }

  // String filters
  if (filters.player) {
    pineconeFilters.player_name = filters.player;
  }

  if (filters.brand) {
    pineconeFilters.card_brand = filters.brand;
  }

  return pineconeFilters;
}

/**
 * Formats a score as a percentage string
 */
export function formatScore(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

