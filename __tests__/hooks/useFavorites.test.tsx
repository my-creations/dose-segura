import React, { useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react-native';

import { FavoritesContextType, FavoritesProvider, useFavorites } from '@/context/FavoritesContext';
import { FAVORITES_STORAGE_KEY } from '@/favorites/favorites';
import { createMemoryKeyValueStore } from '@/storage/types';

type FavoritesContextValue = FavoritesContextType;

function renderWithProvider(
  onReady: (value: FavoritesContextValue) => void,
  store = createMemoryKeyValueStore(),
) {
  function TestHarness() {
    const contextValue = useFavorites();

    useEffect(() => {
      onReady(contextValue);
    }, [contextValue]);

    return null;
  }

  render(
    <FavoritesProvider store={store}>
      <TestHarness />
    </FavoritesProvider>,
  );

  return store;
}

describe('useFavorites', () => {
  it('starts with empty favorites and finishes loading', async () => {
    let contextValue: FavoritesContextValue | null = null;

    renderWithProvider((value) => {
      contextValue = value;
    });

    await waitFor(() => {
      expect(contextValue?.isLoading).toBe(false);
    });

    expect(contextValue!.favorites).toEqual([]);
    expect(contextValue!.isFavorite('acetilcisteina')).toBe(false);
  });

  it('toggles favorites and persists changes', async () => {
    let contextValue: FavoritesContextValue | null = null;
    const store = createMemoryKeyValueStore();

    renderWithProvider((value) => {
      contextValue = value;
    }, store);

    await waitFor(() => {
      expect(contextValue?.isLoading).toBe(false);
    });

    await act(async () => {
      contextValue!.toggleFavorite('acetilcisteina');
    });

    expect(contextValue!.isFavorite('acetilcisteina')).toBe(true);
    expect(contextValue!.favorites).toContain('acetilcisteina');
    await expect(store.getItem(FAVORITES_STORAGE_KEY)).resolves.toBe(
      JSON.stringify(['acetilcisteina']),
    );

    await act(async () => {
      contextValue!.toggleFavorite('acetilcisteina');
    });

    expect(contextValue!.isFavorite('acetilcisteina')).toBe(false);
    expect(contextValue!.favorites).not.toContain('acetilcisteina');
    await expect(store.getItem(FAVORITES_STORAGE_KEY)).resolves.toBe(JSON.stringify([]));
  });

  it('loads favorites from storage on mount', async () => {
    const store = createMemoryKeyValueStore({
      [FAVORITES_STORAGE_KEY]: JSON.stringify(['acetilcisteina', 'aciclovir']),
    });

    let contextValue: FavoritesContextValue | null = null;

    renderWithProvider((value) => {
      contextValue = value;
    }, store);

    await waitFor(() => {
      expect(contextValue?.isLoading).toBe(false);
    });

    expect(contextValue!.favorites).toEqual(['acetilcisteina', 'aciclovir']);
    expect(contextValue!.isFavorite('acetilcisteina')).toBe(true);
    expect(contextValue!.isFavorite('aciclovir')).toBe(true);
  });
});
