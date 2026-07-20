import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  FAVORITES_STORAGE_KEY,
  isFavoriteId,
  parseFavorites,
  serializeFavorites,
  toggleFavoriteId,
} from '@/favorites/favorites';
import { keyValueStore } from '@/storage/keyValueStore';
import type { KeyValueStore } from '@/storage/types';

export interface FavoritesContextType {
  favorites: string[];
  isLoading: boolean;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: React.ReactNode;
  /** Optional store override for tests. */
  store?: KeyValueStore;
}

export function FavoritesProvider({ children, store = keyValueStore }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFavorites() {
      try {
        const raw = await store.getItem(FAVORITES_STORAGE_KEY);
        if (!cancelled) {
          setFavorites(parseFavorites(raw));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFavorites();

    return () => {
      cancelled = true;
    };
  }, [store]);

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((currentFavorites) => {
        const updated = toggleFavoriteId(currentFavorites, id);
        void store
          .setItem(FAVORITES_STORAGE_KEY, serializeFavorites(updated))
          .catch((error: unknown) => {
            console.error('Error saving favorites:', error);
          });
        return updated;
      });
    },
    [store],
  );

  const isFavorite = useCallback((id: string) => isFavoriteId(favorites, id), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, isLoading, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
