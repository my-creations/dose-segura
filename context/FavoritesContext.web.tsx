import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const FAVORITES_KEY = '@dose_segura_favorites';

export interface FavoritesContextType {
  favorites: string[];
  isLoading: boolean;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

function readFavorites() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const data = window.localStorage.getItem(FAVORITES_KEY);
    return data ? (JSON.parse(data) as string[]) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(() => readFavorites());
  const [isLoading, setIsLoading] = useState(typeof window === 'undefined');

  useEffect(() => {
    setFavorites(readFavorites());
    setIsLoading(false);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((currentFavorites) => {
      const isFav = currentFavorites.includes(id);
      const updated = isFav
        ? currentFavorites.filter((favoriteId) => favoriteId !== id)
        : [...currentFavorites, id];

      try {
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving favorites:', error);
      }

      return updated;
    });
  }, []);

  const isFavorite = useCallback((id: string) => {
    return favorites.includes(id);
  }, [favorites]);

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
