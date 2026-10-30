
import type { MovieStatistics } from "../features/statistics/statistics";

type StatisticsViewProps = {
  statistics: MovieStatistics;
};

export default function StatisticsView({
  statistics,
}: StatisticsViewProps) {
  const maxGenreCount = Math.max(
    1,
    ...statistics.topGenres.map((genre) => genre[1]),
  );

  const maxRatingCount = Math.max(
    1,
    ...statistics.ratingDistribution.map((item) => item.count),
  );

  return (
    <section className="library-section statistics-view">
      <div className="section-heading">
        <div>
          <h2>Your statistics</h2>
          <p>An overview of your movie library</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">TOTAL MOVIES</span>
          <strong className="stat-value">{statistics.totalMovies}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">WATCHED</span>
          <strong className="stat-value">{statistics.watchedCount}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">WATCHLIST</span>
          <strong className="stat-value">{statistics.watchlistCount}</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">COMPLETION</span>
          <strong className="stat-value">{statistics.completionPercentage}%</strong>
        </div>

        <div className="stat-card">
          <span className="stat-label">AVERAGE RATING</span>
          <strong className="stat-value">{statistics.averageRating} ★</strong>
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
            {statistics.topGenres.map(([genre, count]) => (
              <div className="genre-chart-row" key={genre}>
                <span className="genre-chart-label">{genre}</span>

                <div className="genre-chart-track">
                  <div
                    className="genre-chart-fill"
                    style={{
                      width: `${(count / maxGenreCount) * 100}%`,
                    }}
                  />
                </div>

                <span className="genre-chart-count">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rating-distribution">
        <div className="section-heading">
          <div>
            <h2>Rating distribution</h2>
            <p>How you've rated your watched movies</p>
          </div>
        </div>

        <div className="rating-chart">
          {statistics.ratingDistribution.map(({ rating, count }) => (
            <div className="rating-chart-row" key={rating}>
              <span className="rating-chart-label">{rating} ★</span>

              <div className="rating-chart-track">
                <div
                  className="rating-chart-fill"
                  style={{
                    width: `${(count / maxRatingCount) * 100}%`,
                  }}
                />
              </div>

              <span className="rating-chart-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
