
import type { Movie } from "../types/movies";

type MovieDetailsModalProps = {
  movie: Movie;
  onClose: () => void;
  onRate: (movie: Movie) => void;
  onEdit: (movie: Movie) => void;
  onToggleWatched: (movie: Movie) => void;
};

export default function MovieDetailsModal({
  movie,
  onClose,
  onRate,
  onEdit,
  onToggleWatched,
}: MovieDetailsModalProps) {
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
        className="rating-modal movie-details-modal"
        aria-labelledby="details-title"
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Close movie details"
          onClick={onClose}
        >
          ×
        </button>

        <div className="eyebrow">MOVIE DETAILS</div>

        <div className="movie-details-content">
          {movie.poster ? (
            <img
              className="movie-details-poster"
              src={movie.poster}
              alt={`${movie.title} poster`}
            />
          ) : (
            <div className="movie-details-poster poster-placeholder">
              {movie.title}
            </div>
          )}

          <div className="movie-details-info">
            <h2 id="details-title">{movie.title}</h2>

            <p className="movie-details-meta">
              {movie.year ?? "Year unknown"}
              {" · "}
              {movie.genre || "Genre unknown"}
            </p>

            <p className="movie-details-rating">
              <span>★</span>{" "}
              {movie.rating > 0
                ? `${movie.rating.toFixed(1)} / 10`
                : "Not rated"}
            </p>

            <p className="movie-details-status">
              {movie.watched ? "Watched" : "On your watchlist"}
            </p>

            {movie.overview && (
              <p className="movie-details-overview">
                {movie.overview}
              </p>
            )}

            <div className="rating-modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={onClose}
              >
                Close
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={() => onRate(movie)}
              >
                Rate
              </button>

              <button
                type="button"
                className="cancel-button"
                onClick={() => onToggleWatched(movie)}
              >
                {movie.watched
                  ? "Mark as Unwatched"
                  : "Mark as Watched"}
              </button>

              <button
                type="button"
                className="add-button"
                onClick={() => onEdit(movie)}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
