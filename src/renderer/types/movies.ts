
export type Movie = {
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

export type TmdbSearchResult = {
  tmdbId: number;
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
  genre: string;
};
