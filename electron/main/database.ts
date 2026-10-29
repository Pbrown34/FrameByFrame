
import { app } from "electron";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import {
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { join } from "node:path";

// Define the local movie library table.
export const movies = sqliteTable("movies", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  tmdbId: integer("tmdb_id").unique(),

    title: text("title").notNull(),
    year: integer("year"),
    genre: text("genre").notNull().default("Unknown"),
    posterPath: text("poster_path"),
    overview: text("overview").notNull().default(""),

  // Zero means unrated; valid personal ratings are 1–10.
  rating: integer("rating").notNull().default(0),

  watched: integer("watched", { mode: "boolean" })
    .notNull()
    .default(false),

  notes: text("notes").notNull().default(""),

  createdAt: text("created_at")
    .notNull()
    .default("(datetime('now'))"),

  updatedAt: text("updated_at")
    .notNull()
    .default("(datetime('now'))"),
});

// Infer TypeScript types directly from the schema.
export type Movie = typeof movies.$inferSelect;
export type NewMovie = typeof movies.$inferInsert;

// Store the database outside the app installation directory.
const databasePath = join(app.getPath("userData"), "framebyframe.sqlite");

const sqlite = new Database(databasePath);

// Enable foreign-key enforcement for future related tables.
sqlite.pragma("foreign_keys = ON");

// Create the table on first launch.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER UNIQUE,
    title TEXT NOT NULL,
    year INTEGER,
    genre TEXT NOT NULL DEFAULT 'Unknown',
    poster_path TEXT,
    rating INTEGER NOT NULL DEFAULT 0
      CHECK (rating >= 0 AND rating <= 10),
    watched INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
// Add the overview column to existing databases if it is missing.
const movieColumns = sqlite
  .prepare("PRAGMA table_info(movies)")
  .all() as Array<{ name: string }>;

if (!movieColumns.some((column) => column.name === "overview")) {
  sqlite.exec(`
    ALTER TABLE movies
    ADD COLUMN overview TEXT NOT NULL DEFAULT ''
  `);
}

export const db = drizzle(sqlite, { schema: { movies } });
