
export {};

declare global {
  interface Window {
    desktop: {
      movies: {
        list: () => Promise<MovieRecord[]>;

        add: (input: {
          title: string;
          year?: number | null;
          genre?: string;
          posterPath?: string | null;
          overview?: string;
          tmdbId?: number | null;
          rating?: number;
        }) => Promise<MovieRecord>;

        rate: (id: number, rating: number) => Promise<MovieRecord>;

        remove: (id: number) => Promise<{ deleted: boolean }>;

        update: (
        id: number,
        input: {
            title: string;
            year: number | null;
            genre: string;
            posterPath: string | null;
            overview: string;
            tmdbId: number | null;
            rating: number;
            watched?: boolean;
        },
        ) => Promise<unknown>;

        searchTmdb: (query: string) => Promise<
          Array<{
            tmdbId: number;
            title: string;
            year: number | null;
            posterPath: string | null;
            overview: string;
            genre: string;
          }>
        >;
      };
    };
  }

  interface MovieRecord {
    id: number;
    tmdbId: number | null;
    title: string;
    year: number | null;
    genre: string;
    posterPath: string | null;
    overview: string;
    rating: number;
    watched: boolean;
    notes: string;
    createdAt: string;
    updatedAt: string;
  }
}
