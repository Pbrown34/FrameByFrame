
import type { Movie } from "../types/movies";

type MovieCardProps = {
  movie: Movie;
  onViewDetails: (movie: Movie) => void;
  onRate: (movie: Movie) => void;
  onEdit: (movie: Movie) => void;
  onRemove: (movie: Movie) => void;
};

export default function MovieCard({
  movie,
  onViewDetails,
  onRate,
  onEdit,
  onRemove,
}: MovieCardProps) {
  return (
    <article className="movie-card" key={movie.id}>
      <button
        type="button"
        className="poster-button"
        aria-label={`View details for ${movie.title}`}
        onClick={() => onViewDetails(movie)}
      >
        {movie.poster ? (
          <img
            className="movie-poster"
            src={movie.poster}
            alt={`${movie.title} poster`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.visibility = "hidden";
            }}
          />
        ) : (
          <span
            className="movie-poster poster-placeholder"
            aria-label="No poster available"
          >
            {movie.title}
          </span>
        )}

        <span className="poster-overlay">
          <span className="overlay-action">View details ↗</span>
        </span>

        {movie.watched && (
          <span className="watched-badge">✓ WATCHED</span>
        )}
      </button>

      <div className="movie-info">
        <div className="movie-meta">
          <span>{movie.year ?? "Year unknown"}</span>
          <span className="meta-separator">·</span>
          <span>{movie.genre}</span>
        </div>

        <h3>{movie.title}</h3>

        <div className="movie-footer">
          <span className="rating">
            <span>★</span>{" "}
            {movie.rating > 0 ? movie.rating.toFixed(1) : "Not rated"}
          </span>

          <button
            type="button"
            className="rate-button"
            onClick={() => onRate(movie)}
          >
            Rate
          </button>

          <button
            type="button"
            className="rate-button"
            onClick={() => onEdit(movie)}
          >
            Edit
          </button>

          <button
            type="button"
            className="rate-button"
            aria-label={`Remove ${movie.title}`}
            onClick={() => onRemove(movie)}
          >
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
