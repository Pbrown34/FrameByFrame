import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("desktop", {
  movies: {
    list: () => ipcRenderer.invoke("movies:list"),

    add: (input: {
      title: string;
      year?: number | null;
      genre?: string;
      posterPath?: string | null;
      tmdbId?: number | null;
      rating?: number;
    }) => ipcRenderer.invoke("movies:add", input),

    rate: (id: number, rating: number) =>
      ipcRenderer.invoke("movies:rate", id, rating),

    remove: (id: number) =>
      ipcRenderer.invoke("movies:remove", id),

    
    update: (id: number, input: {
    title: string;
    year: number | null;
    genre: string;
    posterPath: string | null;
    tmdbId: number | null;
    rating: number;
    }) => ipcRenderer.invoke("movies:update", id, input),

    searchTmdb: (query: string) =>
        ipcRenderer.invoke("movies:searchTmdb", query),
  },
});
