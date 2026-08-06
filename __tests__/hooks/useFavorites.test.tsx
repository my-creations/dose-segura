import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { FavoritesProvider, useFavorites } from '@/context/FavoritesContext';
import { FAVORITES_STORAGE_KEY } from '@/favorites/favorites';
import { createMemoryKeyValueStore } from '@/storage/types';

function textOf(testId: string): string {
  const children = screen.getByTestId(testId).props.children;
  return children == null ? '' : String(children);
}

function FavoritesProbe() {
  const { favorites, isLoading, isFavorite, toggleFavorite } = useFavorites();

  return (
    <>
      <Text testID="loading">{isLoading ? 'loading' : 'ready'}</Text>
      <Text testID="favorites">{favorites.join(',')}</Text>
      <Text testID="is-acetilcisteina">{isFavorite('acetilcisteina') ? 'yes' : 'no'}</Text>
      <Text testID="is-aciclovir">{isFavorite('aciclovir') ? 'yes' : 'no'}</Text>
      <Pressable
        testID="toggle-acetilcisteina"
        onPress={() => {
          toggleFavorite('acetilcisteina');
        }}
      >
        <Text>toggle</Text>
      </Pressable>
    </>
  );
}

function renderFavorites(store = createMemoryKeyValueStore()) {
  render(
    <FavoritesProvider store={store}>
      <FavoritesProbe />
    </FavoritesProvider>,
  );

  return store;
}

async function waitUntilReady() {
  await waitFor(() => {
    expect(textOf('loading')).toBe('ready');
  });
}

describe('useFavorites', () => {
  it('starts with empty favorites and finishes loading', async () => {
    renderFavorites();

    await waitUntilReady();

    expect(textOf('favorites')).toBe('');
    expect(textOf('is-acetilcisteina')).toBe('no');
  });

  it('toggles favorites and persists changes', async () => {
    const store = createMemoryKeyValueStore();
    renderFavorites(store);

    await waitUntilReady();

    fireEvent.press(screen.getByTestId('toggle-acetilcisteina'));

    expect(textOf('is-acetilcisteina')).toBe('yes');
    expect(textOf('favorites')).toBe('acetilcisteina');
    await expect(store.getItem(FAVORITES_STORAGE_KEY)).resolves.toBe(
      JSON.stringify(['acetilcisteina']),
    );

    fireEvent.press(screen.getByTestId('toggle-acetilcisteina'));

    expect(textOf('is-acetilcisteina')).toBe('no');
    expect(textOf('favorites')).toBe('');
    await expect(store.getItem(FAVORITES_STORAGE_KEY)).resolves.toBe(JSON.stringify([]));
  });

  it('loads favorites from storage on mount', async () => {
    const store = createMemoryKeyValueStore({
      [FAVORITES_STORAGE_KEY]: JSON.stringify(['acetilcisteina', 'aciclovir']),
    });

    renderFavorites(store);

    await waitUntilReady();

    expect(textOf('favorites')).toBe('acetilcisteina,aciclovir');
    expect(textOf('is-acetilcisteina')).toBe('yes');
    expect(textOf('is-aciclovir')).toBe('yes');
  });
});
