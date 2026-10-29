
import type { Movie } from "../../types/movies";

export type MovieView = "all" | "watched" | "watchlist";
export type MovieSort = "title" | "rating" | "year";

type FilterMoviesOptions = {
  movies: Movie[];
  query: string;
  view: MovieView;
  sort: MovieSort;
};

export function filterAndSortMovies({
  movies,
  query,
  view,
  sort,
}: FilterMoviesOptions): Movie[] {
  const normalizedQuery = query.toLowerCase();

  const result = movies.filter((movie) => {
    const matchesQuery =
      movie.title.toLowerCase().includes(normalizedQuery) ||
      movie.genre.toLowerCase().includes(normalizedQuery);

    const matchesView =
      view === "all" ||
      (view === "watched" && movie.watched) ||
      (view === "watchlist" && !movie.watched);

    return matchesQuery && matchesView;
  });

  return result.sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "year") return (b.year ?? 0) - (a.year ?? 0);
    return a.title.localeCompare(b.title);
  });
}
