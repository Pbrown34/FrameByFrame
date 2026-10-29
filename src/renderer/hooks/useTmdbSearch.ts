
import { useState } from "react";
import type { TmdbSearchResult } from "../types/movies";

export function useTmdbSearch() {
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [tmdbError, setTmdbError] = useState("");
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);

  async function searchTmdb() {
    const query = tmdbQuery.trim();

    if (!query) {
      setTmdbResults([]);
      setTmdbError("Enter a movie title to search.");
      return;
    }

    setIsSearchingTmdb(true);
    setTmdbError("");

    try {
      const results = await window.desktop.movies.searchTmdb(query);
      setTmdbResults(results);
    } catch (error) {
      setTmdbError(
        error instanceof Error ? error.message : "TMDB search failed.",
      );
    } finally {
      setIsSearchingTmdb(false);
    }
  }

  function resetTmdbSearch() {
    setTmdbQuery("");
    setTmdbResults([]);
    setTmdbError("");
    }
  function selectTmdbMovie(
    movie: TmdbSearchResult,
    onSelect: (movie: TmdbSearchResult) => void,
  ) {
    onSelect(movie);
    setTmdbResults([]);
    setTmdbQuery(movie.title);
    setTmdbError("");
  }

  return {
    tmdbQuery,
    setTmdbQuery,
    tmdbResults,
    setTmdbResults,
    tmdbError,
    setTmdbError,
    isSearchingTmdb,
    searchTmdb,
    selectTmdbMovie,
    resetTmdbSearch,
  };
}
