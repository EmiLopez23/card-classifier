import { useCardSearch } from "@/hooks";
import { SearchFilters, SearchWeights } from "@/types/search";
import { toast } from "sonner";
import CardSearch from "../card-search";
import SearchResults from "../search-results";

export default function SearchTab() {
  const {
    search,
    isSearching,
    results,
    error: searchError,
    lastQuery,
  } = useCardSearch();

  const handleSearch = async (
    query: string,
    filters: SearchFilters,
    weights: SearchWeights
  ) => {
    await search(query, filters, weights);
    if (searchError) {
      toast.error(searchError);
    }
  };

  return (
    <>
      {/* Search Input */}
      <CardSearch onSearch={handleSearch} isSearching={isSearching} />

      {/* Search Results */}
      <div className="flex flex-col">
        <SearchResults
          results={results}
          loading={isSearching}
          query={lastQuery}
        />
      </div>
    </>
  );
}
