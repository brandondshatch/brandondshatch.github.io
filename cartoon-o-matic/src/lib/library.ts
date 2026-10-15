import { useCallback, useMemo } from 'react';
import { usePersistent } from './storage';

export interface LibraryState {
  watchlist: string[];
  watched: Record<string, number[]>; // id → timestamps
  favorites: string[];
  spins: { id: string; at: number }[];
}

const EMPTY: LibraryState = { watchlist: [], watched: {}, favorites: [], spins: [] };

export function useLibrary() {
  const [state, setState] = usePersistent<LibraryState>('library', EMPTY);

  const toggleWatchlist = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        watchlist: s.watchlist.includes(id) ? s.watchlist.filter((x) => x !== id) : [...s.watchlist, id],
      })),
    [setState],
  );
  const addToWatchlist = useCallback(
    (ids: string[]) => setState((s) => ({ ...s, watchlist: [...s.watchlist, ...ids.filter((i) => !s.watchlist.includes(i))] })),
    [setState],
  );
  const setWatchlist = useCallback((ids: string[]) => setState((s) => ({ ...s, watchlist: ids })), [setState]);
  const toggleFavorite = useCallback(
    (id: string) =>
      setState((s) => ({
        ...s,
        favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id],
      })),
    [setState],
  );
  const markWatched = useCallback(
    (id: string) => setState((s) => ({ ...s, watched: { ...s.watched, [id]: [...(s.watched[id] ?? []), Date.now()] } })),
    [setState],
  );
  const unmarkWatched = useCallback(
    (id: string) =>
      setState((s) => {
        const w = { ...s.watched };
        delete w[id];
        return { ...s, watched: w };
      }),
    [setState],
  );
  const recordSpin = useCallback(
    (id: string) => setState((s) => ({ ...s, spins: [{ id, at: Date.now() }, ...s.spins].slice(0, 40) })),
    [setState],
  );
  const clearHistory = useCallback(() => setState((s) => ({ ...s, watched: {}, spins: [] })), [setState]);

  const watchedSet = useMemo(() => new Set(Object.keys(state.watched)), [state.watched]);

  return {
    state,
    watchedSet,
    toggleWatchlist,
    addToWatchlist,
    setWatchlist,
    toggleFavorite,
    markWatched,
    unmarkWatched,
    recordSpin,
    clearHistory,
  };
}

export type Library = ReturnType<typeof useLibrary>;
