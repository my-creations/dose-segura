import React, { useEffect } from 'react';
import { render, act, waitFor } from '@testing-library/react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { FavoritesContextType, FavoritesProvider, useFavorites } from '@/context/FavoritesContext';

type FavoritesContextValue = FavoritesContextType;

function renderWithProvider(onReady: (value: FavoritesContextValue) => void) {
  function TestHarness() {
    const contextValue = useFavorites();

    useEffect(() => {
      onReady(contextValue);
    }, [contextValue]);

    return null;
  }

  render(
    <FavoritesProvider>
      <TestHarness />
    </FavoritesProvider>
  );
}

describe('useFavorites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    renderWithProvider((value) => {
      contextValue = value;
    });

    await waitFor(() => {
      expect(contextValue?.isLoading).toBe(false);
    });

    await act(async () => {
      contextValue!.toggleFavorite('acetilcisteina');
    });

    expect(contextValue!.isFavorite('acetilcisteina')).toBe(true);
    expect(contextValue!.favorites).toContain('acetilcisteina');
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
      '@dose_segura_favorites',
      JSON.stringify(['acetilcisteina']),
    );

    await act(async () => {
      contextValue!.toggleFavorite('acetilcisteina');
    });

    expect(contextValue!.isFavorite('acetilcisteina')).toBe(false);
    expect(contextValue!.favorites).not.toContain('acetilcisteina');
    expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
      '@dose_segura_favorites',
      JSON.stringify([]),
    );
  });

  it('loads favorites from storage on mount', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(['acetilcisteina', 'aciclovir']),
    );

    let contextValue: FavoritesContextValue | null = null;

    renderWithProvider((value) => {
      contextValue = value;
    });

    await waitFor(() => {
      expect(contextValue?.isLoading).toBe(false);
    });

    expect(contextValue!.favorites).toEqual(['acetilcisteina', 'aciclovir']);
    expect(contextValue!.isFavorite('acetilcisteina')).toBe(true);
    expect(contextValue!.isFavorite('aciclovir')).toBe(true);
  });
});