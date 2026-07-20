export const FAVORITES_STORAGE_KEY = '@dose_segura_favorites';

export function parseFavorites(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export function serializeFavorites(favorites: string[]): string {
  return JSON.stringify(favorites);
}

/** Pure toggle of a Medication Id in the Favorites List. */
export function toggleFavoriteId(favorites: readonly string[], id: string): string[] {
  return favorites.includes(id)
    ? favorites.filter((favoriteId) => favoriteId !== id)
    : [...favorites, id];
}

export function isFavoriteId(favorites: readonly string[], id: string): boolean {
  return favorites.includes(id);
}
