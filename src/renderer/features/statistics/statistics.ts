
import type { Movie } from "../../types/movies";

export type MovieStatistics = {
  totalMovies: number;
  watchedCount: number;
  watchlistCount: number;
  completionPercentage: number;
  averageRating: number;
  ratedCount: number;
  topGenres: Array<[string, number]>;
  ratingDistribution: Array<{
    rating: number;
    count: number;
  }>;
};

export function calculateStatistics(
  movies: Movie[],
): MovieStatistics {
  const watchedMovies = movies.filter((movie) => movie.watched);

  const ratedMovies = movies.filter(
    (movie) => movie.watched && movie.rating > 0,
  );

  const totalRating = ratedMovies.reduce(
    (total, movie) => total + movie.rating,
    0,
  );

  const genreCounts = movies.reduce<
    Record<string, { label: string; count: number }>
  >((counts, movie) => {
    const genres = movie.genre.trim()
      ? movie.genre
          .split(",")
          .map((genre) => genre.trim())
          .filter(Boolean)
      : ["Unknown"];

    const uniqueGenres = new Map(
      genres.map((genre) => [genre.toLowerCase(), genre] as const),
    );

    for (const [key, label] of uniqueGenres) {
      if (!counts[key]) {
        counts[key] = { label, count: 0 };
      }

      counts[key].count += 1;
    }

    return counts;
  }, {});

  const topGenres: Array<[string, number]> = Object.values(genreCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ label, count }) => [label, count]);

  const ratingDistribution = Array.from(
    { length: 10 },
    (_, index) => {
      const rating = index + 1;

      return {
        rating,
        count: ratedMovies.filter(
          (movie) => movie.rating === rating,
        ).length,
      };
    },
  );

  return {
    totalMovies: movies.length,
    watchedCount: watchedMovies.length,
    watchlistCount: movies.length - watchedMovies.length,
    completionPercentage:
      movies.length === 0
        ? 0
        : Math.round((watchedMovies.length / movies.length) * 100),
    averageRating:
      ratedMovies.length === 0
        ? 0
        : Number((totalRating / ratedMovies.length).toFixed(1)),
    ratedCount: ratedMovies.length,
    topGenres,
    ratingDistribution,
  };
}
