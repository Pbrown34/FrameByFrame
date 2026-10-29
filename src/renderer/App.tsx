import { useEffect, useMemo, useState } from "react";

type Movie = {
  id: number;
  tmdbId: number | null;
  title: string;
  year: number | null;
  genre: string;
  rating: number;
  poster: string;
  overview: string;
  watched: boolean;
};

type TmdbSearchResult = {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
  genre: string;
};

type View = "all" | "watched" | "watchlist" | "statistics";

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

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("all");
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[]>([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);
  const [tmdbError, setTmdbError] = useState("");
  const [draftTmdbId, setDraftTmdbId] = useState<number | null>(null);
  const [sort, setSort] = useState("title");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [detailsMovie, setDetailsMovie] = useState<Movie | null>(null);
  const [modalMode, setModalMode] = useState<"rate" | "edit">("rate");
  const [draftRating, setDraftRating] = useState(0);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftYear, setDraftYear] = useState(String(new Date().getFullYear()));
  const [draftGenre, setDraftGenre] = useState("");
  const [draftPoster, setDraftPoster] = useState("");
  const [draftOverview, setDraftOverview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadMovies() {
    try {
      setError("");
      const records = await window.desktop.movies.list();
      setMovies(records.map(toMovie));
    } catch (err) {
      console.error("Failed to load movies:", err);
      setError("Could not load your movie library. Please restart the app and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadMovies();
  }, []);

  const filteredMovies = useMemo(() => {
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
  }, [movies, query, view, sort]);
  const statistics = useMemo(() => {
    const watchedMovies = movies.filter((movie) => movie.watched);
    const ratedMovies = movies.filter(
      (movie) => movie.watched && movie.rating > 0,
    );

    const totalRating = ratedMovies.reduce(
      (total, movie) => total + movie.rating,
      0,
    );
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
    const genreCounts = movies.reduce<
      Record<string, { label: string; count: number }>
    >((counts, movie) => {
      const genres = movie.genre.trim()
        ? movie.genre
            .split(",")
            .map((genre) => genre.trim())
            .filter(Boolean)
        : ["Unknown"];

      // Prevent a movie from counting twice toward the same genre.
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
      topGenres, ratingDistribution,
    };
  }, [movies]);

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
    setDraftTitle("");
    setDraftYear(String(new Date().getFullYear()));
    setDraftGenre("");
    setDraftPoster("");
    setDraftRating(0);
    setError("");
    setTmdbQuery("");
    setTmdbResults([]);
    setTmdbError("");
    setDraftTmdbId(null);
  }

  function openRating(movie: Movie) {
    setModalMode("rate");
    setSelectedMovie(movie);
    setDraftTitle(movie.title);
    setDraftYear(movie.year !== null ? String(movie.year) : "");
    setDraftGenre(movie.genre);
    setDraftPoster(movie.poster);
    setDraftOverview(movie.overview);
    setDraftRating(movie.rating);
    setDraftTmdbId(movie.tmdbId);
    setTmdbQuery("");
    setTmdbResults([]);
    setTmdbError("");
    setError("");
  }

  function openMovieDetails(movie: Movie) {
  setDetailsMovie(movie);
  }

  function openEditMovie(movie: Movie) {
    openRating(movie);
    setModalMode("edit");
  }

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

  function selectTmdbMovie(movie: TmdbSearchResult) {
    setDraftTmdbId(movie.tmdbId);
    setDraftTitle(movie.title);
    setDraftYear(movie.year ? String(movie.year) : "");
    setDraftGenre(movie.genre);
    setDraftPoster(
      movie.posterPath
        ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
        : "",
    );
    setDraftOverview(movie.overview);
    setTmdbResults([]);
    setTmdbQuery(movie.title);
    setTmdbError("");
  }

  async function saveMovie() {
    if (!selectedMovie) return;

    setError("");
    setIsSaving(true);

    try {
      if (selectedMovie.id === -1) {
        // Add a new movie.
        if (!draftTitle.trim()) {
          setError("Please enter a movie title.");
          return;
        }

        if (
          draftTmdbId !== null &&
          movies.some((movie) => movie.tmdbId === draftTmdbId)
        ) {
          setError("This movie is already in your library.");
          return;
        }

        const yearValue = draftYear.trim() ? Number(draftYear) : null;

        if (
          yearValue !== null &&
          (!Number.isInteger(yearValue) ||
            yearValue < 1888 ||
            yearValue > 2200)
        ) {
          setError("Enter a valid release year, or leave it blank.");
          return;
        }

        await window.desktop.movies.add({
          title: draftTitle.trim(),
          year: yearValue,
          genre: draftGenre.trim(),
          posterPath: draftPoster.trim() || null,
          overview: draftOverview.trim(),
          tmdbId: draftTmdbId,
          rating: draftRating,
        });
      } else if (modalMode === "rate") {
        // Update only the rating and watched status.
        if (
          !Number.isInteger(draftRating) ||
          draftRating < 0 ||
          draftRating > 10
        ) {
          setError("Choose a rating from 0 to 10.");
          return;
        }

        await window.desktop.movies.rate(
          selectedMovie.id,
          draftRating,
        );
      } else {
        // Edit the movie details and rating.
        if (!draftTitle.trim()) {
          setError("Please enter a movie title.");
          return;
        }

        if (
          !Number.isInteger(draftRating) ||
          draftRating < 0 ||
          draftRating > 10
        ) {
          setError("Choose a rating from 0 to 10.");
          return;
        }

        const yearValue = draftYear.trim() ? Number(draftYear) : null;

        if (
          yearValue !== null &&
          (!Number.isInteger(yearValue) ||
            yearValue < 1888 ||
            yearValue > 2200)
        ) {
          setError("Enter a valid release year, or leave it blank.");
          return;
        }

        if (
          draftTmdbId !== null &&
          movies.some(
            (movie) =>
              movie.tmdbId === draftTmdbId &&
              movie.id !== selectedMovie.id,
          )
        ) {
          setError(
            "Another movie in your library already uses this TMDB entry.",
          );
          return;
        }

        await window.desktop.movies.update(selectedMovie.id, {
          title: draftTitle.trim(),
          year: yearValue,
          genre: draftGenre.trim(),
          posterPath: draftPoster.trim() || null,
          overview: draftOverview.trim(),
          tmdbId: draftTmdbId,
          rating: draftRating,
        });
      }

      setSelectedMovie(null);
      await loadMovies();
    } catch (err) {
      console.error("Failed to save movie:", err);
      setError(
        err instanceof Error ? err.message : "Could not save the movie.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeMovie(movie: Movie) {
    const confirmed = window.confirm(`Remove “${movie.title}” from your library?`);
    if (!confirmed) return;

    try {
      setError("");
      await window.desktop.movies.remove(movie.id);
      await loadMovies();
      if (selectedMovie?.id === movie.id) setSelectedMovie(null);
    } catch (err) {
      console.error("Failed to remove movie:", err);
      setError(err instanceof Error ? err.message : "Could not remove the movie.");
    }
  }

  const ratedMovies = movies.filter((movie) => movie.rating > 0);
  const averageRating = ratedMovies.length
    ? (
        ratedMovies.reduce((sum, movie) => sum + movie.rating, 0) /
        ratedMovies.length
      ).toFixed(1)
    : "—";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">F</div>
          <span>FRAME<span className="brand-accent">BY</span>FRAME</span>
        </div>

        <div className="sidebar-label">LIBRARY</div>
        <nav className="nav-list">
          <button className={`nav-item ${view === "all" ? "active" : ""}`} onClick={() => setView("all")}>
            <span>▦</span> All Movies <span className="nav-count">{movies.length}</span>
          </button>
          <button className={`nav-item ${view === "watched" ? "active" : ""}`} onClick={() => setView("watched")}>
            <span>✓</span> Watched
          </button>
          <button className={`nav-item ${view === "watchlist" ? "active" : ""}`} onClick={() => setView("watchlist")}>
            <span>◷</span> Watchlist
            <span className="nav-count">{movies.filter((movie) => !movie.watched).length}</span>
          </button>
          <button
            className={`nav-item ${view === "statistics" ? "active" : ""}`}
            onClick={() => setView("statistics")}
          >
            <span>▤</span> Statistics
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">M</div>
          <div>
            <div className="profile-name">My Collection</div>
            <div className="profile-subtitle">Personal movie library</div>
          </div>
        </div>
      </aside>

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
              <div className="stat-label">IN YOUR LIBRARY</div>
              <div className="stat-value">{movies.length}</div>
              <div className="stat-note">Movies collected</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">WATCHED</div>
              <div className="stat-value">{movies.filter((movie) => movie.watched).length}</div>
              <div className="stat-note">Stories experienced</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">AVERAGE RATING</div>
              <div className="stat-value">{averageRating}<span className="stat-star"> ★</span></div>
              <div className="stat-note">Out of 10</div>
            </div>
        </section>
        )}
        {view === "statistics" ? (
          <section className="library-section">
            <div className="section-heading">
              <div>
                <h2>Your statistics</h2>
                <p>An overview of your movie collection</p>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">TOTAL MOVIES</div>
                <div className="stat-value">{statistics.totalMovies}</div>
                <div className="stat-note">Movies in your library</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">WATCHED</div>
                <div className="stat-value">{statistics.watchedCount}</div>
                <div className="stat-note">Movies marked as watched</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">WATCHLIST</div>
                <div className="stat-value">{statistics.watchlistCount}</div>
                <div className="stat-note">Movies waiting to be watched</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">COMPLETION</div>
                <div className="stat-value">
                  {statistics.completionPercentage}%
                </div>
                <div className="stat-note">Of your library watched</div>
              </div>

              <div className="stat-card">
                <div className="stat-label">AVERAGE RATING</div>
                <div className="stat-value">
                  {statistics.averageRating}
                  <span className="stat-star"> ★</span>
                </div>
                <div className="stat-note">
                  Across {statistics.ratedCount} rated movies
                </div>
              </div>
            </div>

            <div className="section-heading">
              <div>
                <h2>Top genres</h2>
                <p>Your five most common genres</p>
              </div>
            </div>

            <div className="genre-breakdown">
              <div className="section-heading">
                <div>
                  <h2>Top Genres</h2>
                  <p>Movies in your collection by genre</p>
                </div>
              </div>

              {statistics.topGenres.length === 0 ? (
                <p className="genre-empty">
                  Add movies to see your genre breakdown.
                </p>
              ) : (
                <div className="genre-chart">
                  {statistics.topGenres.map(([genre, count]) => {
                    const maxCount = Math.max(
                      1,
                      ...statistics.topGenres.map((item) => item[1]),
                    );

                    return (
                      <div className="genre-chart-row" key={genre}>
                        <span className="genre-chart-label">{genre}</span>

                        <div className="genre-chart-track">
                          <div
                            className="genre-chart-fill"
                            style={{
                              width: `${(count / maxCount) * 100}%`,
                            }}
                          />
                        </div>

                        <span className="genre-chart-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
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
                  onChange={(event) => setSort(event.target.value)}
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
                  <article className="movie-card" key={movie.id}>
                    <button
                      type="button"
                      className="poster-button"
                      aria-label={`View details for ${movie.title}`}
                      onClick={() => openMovieDetails(movie)}
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
                          {movie.rating > 0
                            ? movie.rating.toFixed(1)
                            : "Not rated"}
                        </span>

                        <button
                          type="button"
                          className="rate-button"
                          onClick={() => openRating(movie)}
                        >
                          Rate
                        </button>

                        <button
                          type="button"
                          className="rate-button"
                          onClick={() => openEditMovie(movie)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="rate-button"
                          aria-label={`Remove ${movie.title}`}
                          onClick={() => void removeMovie(movie)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!isLoading && filteredMovies.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">⌕</div>
                <h3>
                  {movies.length === 0
                    ? "Your library is empty"
                    : "No movies found"}
                </h3>
                <p>
                  {movies.length === 0
                    ? "Add your first movie to start building your collection."
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
        <div className="rating-distribution">
          <div className="section-heading">
            <div>
              <h2>Rating distribution</h2>
              <p>How you've rated your watched movies</p>
            </div>
          </div>

          <div className="rating-chart">
            {statistics.ratingDistribution.map(({ rating, count }) => {
              const maxCount = Math.max(
                1,
                ...statistics.ratingDistribution.map((item) => item.count),
              );

              return (
                <div className="rating-chart-row" key={rating}>
                  <span className="rating-chart-label">{rating} ★</span>

                  <div className="rating-chart-track">
                    <div
                      className="rating-chart-fill"
                      style={{
                        width: `${(count / maxCount) * 100}%`,
                      }}
                    />
                  </div>

                  <span className="rating-chart-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <footer className="app-footer">
          <span>FRAMEBYFRAME <span className="footer-dot">·</span> YOUR COLLECTION, YOUR STORY</span>
          <span>LOCAL-FIRST MOVIE TRACKER</span>
        </footer>
      </main>

      {selectedMovie && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedMovie(null); }}>        
          <section className="rating-modal" aria-labelledby="rating-title">
            <button
              className="modal-close"
              aria-label="Close movie dialog"
              onClick={() => setSelectedMovie(null)}
            >
              ×
            </button>          
            <div className="eyebrow">YOUR PERSONAL REVIEW</div>
            <h2 id="rating-title">
              {selectedMovie.id === -1
                ? "Add a movie"
                : modalMode === "edit"
                  ? "Edit movie"
                  : "Rate movie"}
            </h2>
            <div className="movie-form-fields">
              {(selectedMovie.id === -1 || modalMode === "edit") && (
                <div className="movie-form-fields">
                <>
                  <label>
                    Search TMDB
                    <input
                      autoFocus
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

                  <p className="modal-note">
                    Search TMDB to fill in movie details, or enter them manually below.
                  </p>
                </>  
                </div>
              )}
              {(selectedMovie.id === -1 || modalMode === "edit") && (
              <>
                <label>
                  Movie title
                  <input
                    autoFocus={selectedMovie.id !== -1}
                    value={draftTitle}
                    onChange={(event) => {
                      setDraftTitle(event.target.value);

                      if (selectedMovie.id === -1) {
                        setDraftTmdbId(null);
                      }
                    }}
                    placeholder="e.g. Arrival"
                  />
                </label>

                <label>
                  Release year (optional)
                  <input
                    inputMode="numeric"
                    value={draftYear}
                    onChange={(event) => setDraftYear(event.target.value)}
                    placeholder="e.g. 2016"
                  />
                </label>

                <label>
                  Genre (optional)
                  <input
                    value={draftGenre}
                    onChange={(event) => setDraftGenre(event.target.value)}
                    placeholder="e.g. Sci-Fi"
                  />
                </label>

                <label>
                  Poster image URL (optional)
                  <input
                    value={draftPoster}
                    onChange={(event) => setDraftPoster(event.target.value)}
                    placeholder="https://…"
                  />
                </label>
                </>
              )}
            </div>
            <p>
              {selectedMovie.id === -1
                ? "Add it to your library and optionally give it a rating."
                : modalMode === "edit"
                  ? "Update this movie's details and rating."
                  : "Choose a rating from 0 to 10."}
            </p>
            <div className="rating-picker" aria-label="Choose a rating">
              <button
                type="button"
                className={draftRating === 0 ? "chosen" : ""}
                aria-label="Not rated"
                aria-pressed={draftRating === 0}
                onClick={() => setDraftRating(0)}
              >
                —
              </button>

              {Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => (
                <button
                  type="button"
                  key={rating}
                  className={draftRating >= rating ? "chosen" : ""}
                  aria-label={`${rating} out of 10`}
                  aria-pressed={draftRating === rating}
                  onClick={() => setDraftRating(rating)}
                >
                  {rating}
                </button>
              ))}
            </div>

            {error && (
              <p role="alert" className="modal-note">
                {error}
              </p>
            )}

            <div className="rating-modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setSelectedMovie(null);
                  setError("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="add-button"
                disabled={isSaving}
                onClick={() => void saveMovie()}
              >
                {isSaving
                  ? "Saving…"
                  : selectedMovie.id === -1
                    ? "Add to library"
                    : "Save changes"}
              </button>
            </div>
          </section>
        </div>
      )}
      
      {detailsMovie && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDetailsMovie(null);
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
              onClick={() => setDetailsMovie(null)}
            >
              ×
            </button>

            <div className="eyebrow">MOVIE DETAILS</div>

            <div className="movie-details-content">
              {detailsMovie.poster ? (
                <img
                  className="movie-details-poster"
                  src={detailsMovie.poster}
                  alt={`${detailsMovie.title} poster`}
                />
              ) : (
                <div className="movie-details-poster poster-placeholder">
                  {detailsMovie.title}
                </div>
              )}

              <div className="movie-details-info">
                <h2 id="details-title">{detailsMovie.title}</h2>

                <p className="movie-details-meta">
                  {detailsMovie.year ?? "Year unknown"}
                  {" · "}
                  {detailsMovie.genre || "Genre unknown"}
                </p>

                <p className="movie-details-rating">
                  <span>★</span>{" "}
                  {detailsMovie.rating > 0
                    ? `${detailsMovie.rating.toFixed(1)} / 10`
                    : "Not rated"}
                </p>

                <p className="movie-details-status">
                  {detailsMovie.watched ? "Watched" : "On your watchlist"}
                </p>
                {detailsMovie.overview && (
                  <p className="movie-details-overview">
                    {detailsMovie.overview}
                  </p>
                )}
                <div className="rating-modal-actions">
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setDetailsMovie(null)}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      const movie = detailsMovie;
                      setDetailsMovie(null);
                      openRating(movie);
                    }}
                  >
                    Rate
                  </button>
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={async () => {
                      const movie = detailsMovie;

                      if (!movie) return;

                      try {
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

                        await loadMovies();

                        setDetailsMovie({
                          ...movie,
                          watched: !movie.watched,
                        });
                      } catch (error) {
                        console.error("Failed to update watched status:", error);
                      }
                    }}
                  >
                    {detailsMovie.watched ? "Mark as Unwatched" : "Mark as Watched"}
                  </button>
                  <button
                    type="button"
                    className="add-button"
                    onClick={() => {
                      const movie = detailsMovie;
                      setDetailsMovie(null);
                      openEditMovie(movie);
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}

export default App;
