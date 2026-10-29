import { useMemo, useState } from "react";
import type { Movie, TmdbSearchResult } from "./types/movies";
import MovieCard from "./components/MovieCard";
import MovieDetailsModal from "./components/MovieDetailsModal";
import MovieFormModal from "./components/MovieFormModal";
import { calculateStatistics } from "./features/statistics/statistics";
import {
  filterAndSortMovies,
  type MovieSort,
} from "./features/movies/movieFilters";
import {
  createEmptyMovieDraft,
  validateMovieDraft,
  type MovieDraft,
} from "./features/movies/movieValidation";
import { useMovies } from "./hooks/useMovies";
import { useTmdbSearch } from "./hooks/useTmdbSearch";
import StatisticsView from "./components/StatisticsView";
import AppSidebar from "./components/AppSidebar";

type View = "all" | "watched" | "watchlist" | "statistics";

function App() {
  const {
    movies,
    isLoading,
    error,
    setError,
    removeMovie,
    toggleWatched,
    addMovie,
    updateMovie,
    rateMovie,
  } = useMovies();

  const {
    tmdbQuery,
    setTmdbQuery,
    tmdbResults,
    tmdbError,
    isSearchingTmdb,
    searchTmdb,
    selectTmdbMovie,
    resetTmdbSearch,
  } = useTmdbSearch();

  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("all");
  const [sort, setSort] = useState<MovieSort>("title");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [detailsMovie, setDetailsMovie] = useState<Movie | null>(null);
  const [modalMode, setModalMode] = useState<"rate" | "edit">("rate");
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<MovieDraft>(createEmptyMovieDraft());

  const filteredMovies = useMemo(
    () =>
      filterAndSortMovies({
        movies,
        query,
        view: view === "statistics" ? "all" : view,
        sort,
      }),
    [movies, query, view, sort],
  );

  const statistics = useMemo(
    () => calculateStatistics(movies),
    [movies],
  );

  function handleSelectTmdbMovie(movie: TmdbSearchResult) {
    selectTmdbMovie(movie, (selectedMovie) => {
      setDraft((current) => ({
        ...current,
        tmdbId: selectedMovie.tmdbId,
        title: selectedMovie.title,
        year: selectedMovie.year !== null
          ? String(selectedMovie.year)
          : "",
        genre: selectedMovie.genre,
        poster: selectedMovie.posterPath
          ? `https://image.tmdb.org/t/p/w500${selectedMovie.posterPath}`
          : "",
        overview: selectedMovie.overview,
      }));
    });
  }
  function openAddMovie() {
    setSelectedMovie({
      id: -1,
      title: "",
      year: new Date().getFullYear(),
      genre: "",
      rating: 0,
      poster: "",
      overview: "",
      watched: false,
      tmdbId: null,
    });
    setDraft(createEmptyMovieDraft());
    setError("");
    resetTmdbSearch();
  }
  async function handleToggleWatched(movie: Movie) {
    const succeeded = await toggleWatched(movie);

    if (!succeeded) return;

    setDetailsMovie((current) =>
      current?.id === movie.id
        ? { ...current, watched: !movie.watched }
        : current,
    );
  }

  function openRating(movie: Movie) {
    setModalMode("rate");
    setSelectedMovie(movie);

    setDraft({
      title: movie.title,
      year: movie.year !== null ? String(movie.year) : "",
      genre: movie.genre,
      poster: movie.poster,
      overview: movie.overview,
      tmdbId: movie.tmdbId,
      rating: movie.rating,
    });

    resetTmdbSearch();
    setError("");
  }

  function openMovieDetails(movie: Movie) {
    setDetailsMovie(movie);
  }

  function openEditMovie(movie: Movie) {
    openRating(movie);
    setModalMode("edit");
  }


  async function saveMovie() {
    if (!selectedMovie) return;

    setError("");
    setIsSaving(true);

    try {
      if (modalMode === "rate" && selectedMovie.id !== -1) {
        if (
          !Number.isInteger(draft.rating) ||
          draft.rating < 0 ||
          draft.rating > 10
        ) {
          setError("Choose a rating from 0 to 10.");
          return;
        }

        const rated = await rateMovie(selectedMovie.id, draft.rating);

        if (!rated) {
          setError("Could not rate the movie. Please try again.");
          return;
        }
      } else {
        const validation = validateMovieDraft(
          draft,
          movies,
          selectedMovie.id === -1 ? null : selectedMovie.id,
        );

        if (!validation.valid) {
          setError(validation.error);
          return;
        }

        if (selectedMovie.id === -1) {
          const added = await addMovie(validation.input);

          if (!added) {
            setError("Could not add the movie. Please try again.");
            return;
          }
        } else {
          const updated = await updateMovie(
            selectedMovie.id,
            validation.input,
          );

          if (!updated) {
            setError("Could not update the movie. Please try again.");
            return;
          }
        }
      }

      setSelectedMovie(null);
    } catch (err) {
      console.error("Failed to save movie:", err);
      setError(
        err instanceof Error ? err.message : "Could not save the movie.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <AppSidebar
        view={view}
        movies={movies}
        onViewChange={setView}
      />
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Library <span>/</span>{" "}
            {view === "statistics" ? "Statistics" : "Movies"}
          </div>
          <div className="topbar-status">
            <span className="status-dot" /> LOCAL LIBRARY
          </div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">
              {view === "statistics"
                ? "YOUR LIBRARY INSIGHTS"
                : "YOUR PERSONAL CINEMA"}
            </div>

            <h1>
              {view === "statistics"
                ? "Your movie statistics"
                : "Your movie universe"}
              <span>.</span>
            </h1>

            <p className="page-description">
              {view === "statistics"
                ? "Explore your collection, ratings, and viewing habits."
                : "Keep track of the stories worth remembering."}
            </p>
          </div>

          {view !== "statistics" && (
            <button className="add-button" onClick={openAddMovie}>
              <span>＋</span> Add a movie
            </button>
          )}
        </section>

        {view !== "statistics" && (
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">IN YOUR LIBRARY </div>
              <div className="stat-value">{movies.length}</div>
              <div className="stat-note">Movies collected</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">WATCHED </div>
              <div className="stat-value">{statistics.watchedCount}</div>
              <div className="stat-note">Stories experienced</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">AVERAGE RATING </div>
              <div className="stat-value">
                {statistics.averageRating}
                <span className="stat-star"> ★</span>
              </div>
              <div className="stat-note">Out of 10</div>
            </div>
          </section>
        )}
        {view === "statistics" ? (
          <StatisticsView statistics={statistics} />
        ) : (
          <section className="library-section">
            <div className="section-heading">
              <div>
                <h2>
                  {view === "all"
                    ? "All movies"
                    : view === "watched"
                      ? "Watched movies"
                      : "Your watchlist"}
                </h2>
                <p>{filteredMovies.length} titles in this view</p>
              </div>
            </div>

            <div className="toolbar">
              <label className="search-box">
                <span>⌕</span>
                <input
                  aria-label="Search movies"
                  placeholder="Search titles or genres..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <kbd>SEARCH</kbd>
              </label>

              <label className="sort-control">
                <span>Sort by</span>
                <select
                  aria-label="Sort movies"
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as MovieSort)
                  }
                >
                  <option value="title">Title</option>
                  <option value="rating">Rating</option>
                  <option value="year">Release year</option>
                </select>
              </label>
            </div>

            {error && !selectedMovie && (
              <p role="alert" className="modal-note">{error}</p>
            )}

            {isLoading ? (
              <div className="empty-state">
                <h3>Loading your library…</h3>
              </div>
            ) : (
              <div className="movie-grid">
                {filteredMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onViewDetails={openMovieDetails}
                    onRate={openRating}
                    onEdit={openEditMovie}
                    onRemove={(movie) => void removeMovie(movie)}
                  />
                ))}
              </div>
            )}

            {!isLoading && filteredMovies.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">⌕</div>
                <h3>
                  {movies.length === 0
                    ? "Your library is empty"
                    : view === "watched" && filteredMovies.length === 0
                      ? "No watched movies yet"
                      : view === "watchlist" && filteredMovies.length === 0
                        ? "Your watchlist is empty"
                        : "No movies found"}
                </h3>
                <p>
                  {movies.length === 0
                    ? "Add your first movie to start building your collection."
                    : view === "watched" && filteredMovies.length === 0
                      ? "Mark a movie as watched to see it here."
                      : view === "watchlist" && filteredMovies.length === 0
                        ? "Movies you haven't watched yet will appear here."
                        : "Try another search or switch library filters."}
                </p>

                {movies.length === 0 ? (
                  <button
                    className="text-button"
                    onClick={openAddMovie}
                  >
                    Add a movie
                  </button>
                ) : (
                  <button
                    className="text-button"
                    onClick={() => {
                      setQuery("");
                      setView("all");
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </section>
        )}
        <footer className="app-footer">
          <span>FRAMEBYFRAME <span className="footer-dot">·</span> YOUR COLLECTION, YOUR STORY</span>
          <span>LOCAL-FIRST MOVIE TRACKER</span>
        </footer>
      </main>

      {selectedMovie && (
        <MovieFormModal
          selectedMovie={selectedMovie}
          modalMode={modalMode}
          draft={draft}
          setDraft={setDraft}
          tmdbQuery={tmdbQuery}
          setTmdbQuery={setTmdbQuery}
          tmdbResults={tmdbResults}
          tmdbError={tmdbError}
          isSearchingTmdb={isSearchingTmdb}
          isSaving={isSaving}
          error={error}
          searchTmdb={searchTmdb}
          selectTmdbMovie={handleSelectTmdbMovie}
          onClose={() => setSelectedMovie(null)}
          onSave={saveMovie}
        />
      )}

      {detailsMovie && (
        <MovieDetailsModal
          movie={detailsMovie}
          onClose={() => setDetailsMovie(null)}
          onRate={(movie) => {
            setDetailsMovie(null);
            openRating(movie);
          }}
          onEdit={(movie) => {
            setDetailsMovie(null);
            openEditMovie(movie);
          }}
          onToggleWatched={handleToggleWatched}
        />
      )}

    </div>
  );
}

export default App;
