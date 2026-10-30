
import type { Movie, TmdbSearchResult } from "../types/movies";
import type { MovieDraft } from "../features/movies/movieValidation";

type MovieFormModalProps = {
  selectedMovie: Movie;
  modalMode: "add" | "edit" | "rate";
  draft: MovieDraft;
  setDraft: React.Dispatch<React.SetStateAction<MovieDraft>>;
  tmdbQuery: string;
  setTmdbQuery: (value: string) => void;
  tmdbResults: TmdbSearchResult[];
  tmdbError: string;
  isSearchingTmdb: boolean;
  isSaving: boolean;
  error: string;
  searchTmdb: () => void | Promise<void>;
  selectTmdbMovie: (movie: TmdbSearchResult) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
};

export default function MovieFormModal({
  selectedMovie,
  modalMode,
  draft,
  setDraft,
  tmdbQuery,
  setTmdbQuery,
  tmdbResults,
  tmdbError,
  isSearchingTmdb,
  isSaving,
  error,
  searchTmdb,
  selectTmdbMovie,
  onClose,
  onSave,
}: MovieFormModalProps) {
  const isAdding = selectedMovie.id === -1;
  const isEditing = modalMode === "edit";

  const tmdbSearch = (
    <>
      <label>
        {isAdding ? "Search TMDB to add a movie" : "Search TMDB"}
        <input
          autoFocus={!isEditing}
          value={tmdbQuery}
          onChange={(event) => setTmdbQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void searchTmdb();
            }
          }}
          placeholder="Search for a movie..."
        />
      </label>

      <button
        type="button"
        className="add-button"
        disabled={isSearchingTmdb}
        onClick={() => void searchTmdb()}
      >
        {isSearchingTmdb ? "Searching…" : "Search TMDB"}
      </button>

      {tmdbError && (
        <p role="alert" className="modal-note">
          {tmdbError}
        </p>
      )}

      {tmdbResults.length > 0 && (
        <div className="tmdb-results">
          {tmdbResults.map((movie) => (
            <button
              type="button"
              key={movie.tmdbId}
              className="tmdb-result"
              onClick={() => selectTmdbMovie(movie)}
            >
              {movie.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w185${movie.posterPath}`}
                  alt=""
                  className="tmdb-result-poster"
                />
              ) : (
                <div className="tmdb-result-poster tmdb-no-poster">
                  No poster
                </div>
              )}

              <span className="tmdb-result-info">
                <strong>{movie.title}</strong>
                <span>{movie.year ?? "Release year unknown"}</span>
                <span>{movie.genre}</span>
                {movie.overview && (
                  <span className="tmdb-result-overview">
                    {movie.overview}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );

  const movieDetailsFields = (
    <>
      <label className="movie-title-field">
        Movie title
        <input
          value={draft.title}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
          placeholder="e.g. Arrival"
        />
      </label>

      <label>
        Release year (optional)
        <input
          inputMode="numeric"
          value={draft.year}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              year: event.target.value,
            }))
          }
          placeholder="e.g. 2016"
        />
      </label>

      <label>
        Genre (optional)
        <input
          value={draft.genre}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              genre: event.target.value,
            }))
          }
          placeholder="e.g. Sci-Fi"
        />
      </label>

      <label className="movie-poster-field">
        Poster image URL (optional)
        <input
          value={draft.poster}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              poster: event.target.value,
            }))
          }
          placeholder="https://…"
        />
      </label>
    </>
  );

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className={`rating-modal movie-form-modal${isEditing ? " is-editing" : ""}`}
        aria-labelledby="rating-title"
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Close movie dialog"
          onClick={onClose}
        >
          ×
        </button>

        <div className="eyebrow">YOUR PERSONAL REVIEW</div>

        <h2 id="rating-title">
          {isAdding ? "Add a movie" : isEditing ? "Edit movie" : "Rate movie"}
        </h2>

        <div className="movie-form-fields">
          {(isAdding || isEditing) && (
            <>
              {isEditing ? (
                <details className="movie-form-search">
                  <summary>Search TMDB for a replacement</summary>
                  {tmdbSearch}
                </details>
              ) : (
                tmdbSearch
              )}

              <p className="modal-note">
                {isEditing
                  ? "Update the movie details below, or search TMDB for a replacement."
                  : "Search TMDB to find your movie and fill in its details."}
              </p>

              {isAdding ? (
                <details className="movie-form-manual">
                  <summary>Enter details manually instead</summary>
                  {movieDetailsFields}
                </details>
              ) : (
                movieDetailsFields
              )}
            </>
          )}
        </div>

        <p>
          {isAdding
            ? "Add it to your library and optionally give it a rating."
            : isEditing
              ? "Update this movie's details and rating."
              : "Choose a rating from 0 to 10."}
        </p>

        <div className="rating-picker" aria-label="Choose a rating">
          <button
            type="button"
            className={draft.rating === 0 ? "chosen" : ""}
            aria-label="Not rated"
            aria-pressed={draft.rating === 0}
            onClick={() =>
              setDraft((current) => ({ ...current, rating: 0 }))
            }
          >
            —
          </button>

          {Array.from({ length: 10 }, (_, index) => index + 1).map(
            (rating) => (
              <button
                type="button"
                key={rating}
                className={draft.rating >= rating ? "chosen" : ""}
                aria-label={`${rating} out of 10`}
                aria-pressed={draft.rating === rating}
                onClick={() =>
                  setDraft((current) => ({ ...current, rating }))
                }
              >
                {rating}
              </button>
            ),
          )}
        </div>

        {error && (
          <p role="alert" className="modal-note">
            {error}
          </p>
        )}

        <div className="rating-modal-actions">
          <button type="button" className="cancel-button" onClick={onClose}>
            Cancel
          </button>

          <button
            type="button"
            className="add-button"
            disabled={isSaving}
            onClick={() => void onSave()}
          >
            {isSaving
              ? "Saving…"
              : isAdding
                ? "Add to library"
                : "Save changes"}
          </button>
        </div>
      </section>
    </div>
  );
}
