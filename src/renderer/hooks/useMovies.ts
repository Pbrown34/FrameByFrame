
import { useCallback, useEffect, useState } from "react";
import type { Movie } from "../types/movies";
import type { ValidatedMovieInput } from "../features/movies/movieValidation";

function toMovie(record: MovieRecord): Movie {
  return {
    id: record.id,
    tmdbId: record.tmdbId,
    title: record.title,
    year: record.year,
    genre: record.genre,
    rating: record.rating,
    poster: record.posterPath ?? "",
    overview: record.overview ?? "",
    watched: record.watched,
  };
}

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMovies = useCallback(async (): Promise<boolean> => {
        try {
            setError("");
            const records = await window.desktop.movies.list();
            setMovies(records.map(toMovie));
            return true;
        } catch (err) {
            console.error("Failed to load movies:", err);
            setError(
            "Could not load your movie library. Please restart the app and try again.",
            );
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

  useEffect(() => {
    void loadMovies();
  }, [loadMovies]);

  async function toggleWatched(movie: Movie): Promise<boolean> {
    try {
      setError("");

      await window.desktop.movies.update(movie.id, {
        title: movie.title,
        year: movie.year,
        genre: movie.genre,
        posterPath: movie.poster || null,
        overview: movie.overview,
        tmdbId: movie.tmdbId,
        rating: movie.rating,
        watched: !movie.watched,
      });

      const loaded = await loadMovies();
      return loaded;
    } catch (err) {
      console.error("Failed to update watched status:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not update watched status.",
      );
      return false;
    }
  }

  async function addMovie(input: ValidatedMovieInput) {
    try {
      setError("");
      await window.desktop.movies.add(input);

      const loaded = await loadMovies();
      return loaded;
    } catch (err) {
      console.error("Failed to add movie:", err);
      setError(
        err instanceof Error ? err.message : "Could not add the movie.",
      );
      return false;
    }
  }

  async function rateMovie(id: number, rating: number) {
    try {
      setError("");
      await window.desktop.movies.rate(id, rating);

      const loaded = await loadMovies();
      return loaded;
    } catch (err) {
      console.error("Failed to rate movie:", err);
      setError(
        err instanceof Error ? err.message : "Could not rate the movie.",
      );
      return false;
    }
  }

  async function updateMovie(
  id: number,
  input: ValidatedMovieInput,
) {
    try {
      setError("");
      await window.desktop.movies.update(id, input);

      const loaded = await loadMovies();
      return loaded;
    } catch (err) {
      console.error("Failed to update movie:", err);
      setError(
        err instanceof Error ? err.message : "Could not update the movie.",
      );
      return false;
    }
  }

  async function removeMovie(movie: Movie) {
    const confirmed = window.confirm(
      `Remove “${movie.title}” from your library?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      await window.desktop.movies.remove(movie.id);

      const loaded = await loadMovies();
      if (!loaded) return;
    } catch (err) {
      console.error("Failed to remove movie:", err);
      setError(
        err instanceof Error ? err.message : "Could not remove the movie.",
      );
    }
  }

  return {
    movies,
    isLoading,
    error,
    setError,
    removeMovie,
    toggleWatched,
    addMovie,
    updateMovie,
    rateMovie,
    };
}
