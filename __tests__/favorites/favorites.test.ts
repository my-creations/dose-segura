import {
  FAVORITES_STORAGE_KEY,
  isFavoriteId,
  parseFavorites,
  serializeFavorites,
  toggleFavoriteId,
} from '@/favorites/favorites';

describe('favorites', () => {
  it('exposes stable storage key', () => {
    expect(FAVORITES_STORAGE_KEY).toBe('@dose_segura_favorites');
  });

  it('parses valid favorites JSON', () => {
    expect(parseFavorites(JSON.stringify(['a', 'b']))).toEqual(['a', 'b']);
  });

  it('returns empty list for null or invalid payload', () => {
    expect(parseFavorites(null)).toEqual([]);
    expect(parseFavorites('not-json')).toEqual([]);
    expect(parseFavorites(JSON.stringify({ id: 'a' }))).toEqual([]);
    expect(parseFavorites(JSON.stringify([1, 'a']))).toEqual(['a']);
  });

  it('toggles membership', () => {
    expect(toggleFavoriteId([], 'acetilcisteina')).toEqual(['acetilcisteina']);
    expect(toggleFavoriteId(['acetilcisteina'], 'acetilcisteina')).toEqual([]);
    expect(toggleFavoriteId(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('checks membership and serializes', () => {
    expect(isFavoriteId(['a'], 'a')).toBe(true);
    expect(isFavoriteId(['a'], 'b')).toBe(false);
    expect(serializeFavorites(['a', 'b'])).toBe(JSON.stringify(['a', 'b']));
  });
});
