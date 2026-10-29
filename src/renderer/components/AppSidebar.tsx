
import type { Movie } from "../types/movies";

type AppSidebarProps = {
  view: "all" | "watched" | "watchlist" | "statistics";
  movies: Movie[];
  onViewChange: (
    view: "all" | "watched" | "watchlist" | "statistics",
  ) => void;
};

export default function AppSidebar({
  view,
  movies,
  onViewChange,
}: AppSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">F</div>
        <span>
          FRAME<span className="brand-accent">BY</span>FRAME
        </span>
      </div>

      <div className="sidebar-label">LIBRARY</div>

      <nav className="nav-list">
        <button
          className={`nav-item ${view === "all" ? "active" : ""}`}
          onClick={() => onViewChange("all")}
        >
          <span>▦</span> All Movies
          <span className="nav-count">{movies.length}</span>
        </button>

        <button
          className={`nav-item ${view === "watched" ? "active" : ""}`}
          onClick={() => onViewChange("watched")}
        >
          <span>✓</span> Watched
        </button>

        <button
          className={`nav-item ${view === "watchlist" ? "active" : ""}`}
          onClick={() => onViewChange("watchlist")}
        >
          <span>◷</span> Watchlist
          <span className="nav-count">
            {movies.filter((movie) => !movie.watched).length}
          </span>
        </button>

        <button
          className={`nav-item ${view === "statistics" ? "active" : ""}`}
          onClick={() => onViewChange("statistics")}
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
  );
}
