
export type MovieDraft = {
  title: string;
  year: string;
  genre: string;
  poster: string;
  overview: string;
  tmdbId: number | null;
  rating: number;
};

export function createEmptyMovieDraft(): MovieDraft {
  return {
    title: "",
    year: String(new Date().getFullYear()),
    genre: "",
    poster: "",
    overview: "",
    tmdbId: null,
    rating: 0,
  };
}

export type ExistingMovie = {
  id: number;
  tmdbId: number | null;
};

export type ValidatedMovieInput = {
  title: string;
  year: number | null;
  genre: string;
  posterPath: string | null;
  overview: string;
  tmdbId: number | null;
  rating: number;
};

type ValidationResult =
  | { valid: true; input: ValidatedMovieInput }
  | { valid: false; error: string };

export function validateMovieDraft(
  draft: MovieDraft,
  movies: ExistingMovie[],
  currentMovieId: number | null = null,
): ValidationResult {
  const title = draft.title.trim();

  if (!title) {
    return { valid: false, error: "Please enter a movie title." };
  }

  if (
    !Number.isInteger(draft.rating) ||
    draft.rating < 0 ||
    draft.rating > 10
  ) {
    return { valid: false, error: "Choose a rating from 0 to 10." };
  }

  const year = draft.year.trim() ? Number(draft.year) : null;

  if (
    year !== null &&
    (!Number.isInteger(year) || year < 1888 || year > 2200)
  ) {
    return {
      valid: false,
      error: "Enter a valid release year, or leave it blank.",
    };
  }

  if (
    draft.tmdbId !== null &&
    movies.some(
      (movie) =>
        movie.tmdbId === draft.tmdbId &&
        movie.id !== currentMovieId,
    )
  ) {
    return {
      valid: false,
      error:
        currentMovieId === null
          ? "This movie is already in your library."
          : "Another movie in your library already uses this TMDB entry.",
    };
  }

  return {
    valid: true,
    input: {
      title,
      year,
      genre: draft.genre.trim(),
      posterPath: draft.poster.trim() || null,
      overview: draft.overview.trim(),
      tmdbId: draft.tmdbId,
      rating: draft.rating,
    },
  };
}
