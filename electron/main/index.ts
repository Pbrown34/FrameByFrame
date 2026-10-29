
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";
import { asc, eq } from "drizzle-orm";
import { db, movies } from "./database";


dotenv.config({
  path: join(process.cwd(), ".env"),
});

// ------------------------------
// IPC handlers: database operations
// ------------------------------

ipcMain.handle("movies:list", () => {
  return db.select().from(movies).orderBy(asc(movies.title));
});

ipcMain.handle("movies:add", (_event, input) => {
  if (
    !input ||
    typeof input.title !== "string" ||
    !input.title.trim()
  ) {
    throw new Error("A movie title is required.");
  }

  const rating = input.rating ?? 0;

  if (!Number.isInteger(rating) || rating < 0 || rating > 10) {
    throw new Error("Rating must be an integer from 0 to 10.");
  }

  const result = db
    .insert(movies)
    .values({
      title: input.title.trim(),
      year: Number.isInteger(input.year) ? input.year : null,
      genre: typeof input.genre === "string" ? input.genre : "Unknown",
      posterPath:
        typeof input.posterPath === "string" ? input.posterPath : null,
      overview: typeof input.overview === "string" ? input.overview : "",
      tmdbId: Number.isInteger(input.tmdbId) ? input.tmdbId : null,
      rating,
      watched: rating > 0,
    })
    .returning()
    .get();

  return result;
});

ipcMain.handle("movies:rate", (_event, id, rating) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid movie ID.");
  }

  if (!Number.isInteger(rating) || rating < 0 || rating > 10) {
    throw new Error("Rating must be an integer from 0 to 10.");
  }

  const result = db
    .update(movies)
    .set({
      rating,
      watched: rating > 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(movies.id, id))
    .returning()
    .get();

  if (!result) {
    throw new Error("Movie not found.");
  }

  return result;
});

ipcMain.handle("movies:update", (_event, id, input) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid movie ID.");
  }

  if (
    !input ||
    typeof input.title !== "string" ||
    !input.title.trim()
  ) {
    throw new Error("A movie title is required.");
  }

  const rating = input.rating ?? 0;

  if (!Number.isInteger(rating) || rating < 0 || rating > 10) {
    throw new Error("Rating must be an integer from 0 to 10.");
  }

  if (
    input.year !== null &&
    input.year !== undefined &&
    (!Number.isInteger(input.year) ||
      input.year < 1888 ||
      input.year > 2200)
  ) {
    throw new Error("Invalid release year.");
  }

  const result = db
    .update(movies)
    .set({
      title: input.title.trim(),
      year: input.year ?? null,
      genre:
        typeof input.genre === "string"
          ? input.genre.trim()
          : "Unknown",
            posterPath:
        typeof input.posterPath === "string" && input.posterPath.trim()
          ? input.posterPath.trim()
          : null,
      overview:
        typeof input.overview === "string"
          ? input.overview.trim()
          : "",
      tmdbId: Number.isInteger(input.tmdbId) ? input.tmdbId : null,
      rating,
      watched:
        typeof input.watched === "boolean"
          ? input.watched
          : rating > 0,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(movies.id, id))
    .returning()
    .get();

  if (!result) {
    throw new Error("Movie not found.");
  }

  return result;
});

ipcMain.handle("movies:remove", (_event, id) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid movie ID.");
  }

  const result = db
    .delete(movies)
    .where(eq(movies.id, id))
    .returning()
    .get();

  return { deleted: Boolean(result) };
});


let tmdbGenreMap: Map<number, string> | null = null;

async function getTmdbGenreMap(token: string): Promise<Map<number, string>> {
  if (tmdbGenreMap) return tmdbGenreMap;

  const response = await fetch(
    "https://api.themoviedb.org/3/genre/movie/list?language=en",
    {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`TMDB genre lookup failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    genres: Array<{ id: number; name: string }>;
  };

  tmdbGenreMap = new Map(data.genres.map((genre) => [genre.id, genre.name]));
  return tmdbGenreMap;
}

ipcMain.handle("movies:searchTmdb", async (_event, query: unknown) => {
  if (typeof query !== "string" || !query.trim()) {
    return [];
  }

  const token = process.env.TMDB_READ_ACCESS_TOKEN;

  if (!token) {
    throw new Error("TMDB Read Access Token is not configured.");
  }

  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("query", query.trim());
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB search failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      id: number;
      title: string;
      release_date?: string;
      poster_path?: string | null;
      genre_ids?: number[];
      overview?: string;
    }>;
  };


    const genreMap = await getTmdbGenreMap(token);

    return (data.results ?? []).map((movie) => ({
    tmdbId: movie.id,
    title: movie.title,
    year: movie.release_date
        ? Number(movie.release_date.slice(0, 4)) || null
        : null,
    posterPath: movie.poster_path ?? null,
    overview: movie.overview ?? "",
    genre: (movie.genre_ids ?? [])
        .map((id) => genreMap.get(id))
        .filter((name): name is string => Boolean(name))
        .join(", ") || "Unknown",
    }));
});

// ------------------------------
// Main application window
// ------------------------------

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0b0b0f",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

// ------------------------------
// Application lifecycle
// ------------------------------

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
