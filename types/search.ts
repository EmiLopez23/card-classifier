export interface SearchFilters {
  minGrade?: number;
  maxGrade?: number;
  rookie?: boolean;
  autographed?: boolean;
  minYear?: number;
  maxYear?: number;
  player?: string;
  brand?: string;
}

export interface SearchWeights {
  text: number;
  image: number;
}

export interface SearchScores {
  text: number;
  image: number;
  combined: number;
}

export interface CardDetails {
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
}

export interface SearchResult {
  cardId: string;
  scores: SearchScores;
  card: CardDetails;
}

