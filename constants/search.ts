export const SEARCH_DEFAULTS = {
  TEXT_WEIGHT: 0.5,
  IMAGE_WEIGHT: 0.5,
  TOP_K: 10,
  DEBOUNCE_MS: 300,
} as const;

export const SCORE_THRESHOLDS = {
  LOW_SCORE: 0.25,
  LOW_SCORE_SHORT_QUERY: 0.20,
  LOW_SCORE_NO_WINNER: 0.35,
  LOW_SCORE_NO_WINNER_SHORT_QUERY: 0.30,
  SCORE_GAP_THRESHOLD: 0.1,
} as const;

export const FILTER_LIMITS = {
  MIN_GRADE: 1,
  MAX_GRADE: 10,
  SHORT_QUERY_MAX_WORDS: 2,
  SHORT_QUERY_MAX_LENGTH: 20,
  PSA_CERT_MIN_LENGTH: 6,
} as const;

export const SEARCH_PLACEHOLDERS = {
  QUERY: "Search for cards (e.g., LeBron James rookie, high grade basketball)...",
  PLAYER: "e.g., LeBron James",
  BRAND: "e.g., Topps",
  YEAR: "e.g., 2000",
  GRADE: "1-10",
} as const;

