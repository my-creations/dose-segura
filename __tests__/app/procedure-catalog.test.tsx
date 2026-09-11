import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import ProcedureCatalogScreen from '@/app/procedure/catalog';
import { ProceduresProvider } from '@/context/ProceduresContext';
import { BUILTIN_CVP_ID, BUILTIN_SNG_ID } from '@/procedures/builtin';
import {
  CATALOG_MIGRATION_KEY,
  CATALOG_MIGRATION_VALUE,
  STORAGE_KEY,
  adoptFromCatalog,
  findCatalogTemplate,
} from '@/procedures/procedures';
import { createMemoryKeyValueStore } from '@/storage/types';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

function renderCatalog(
  store = createMemoryKeyValueStore({ [CATALOG_MIGRATION_KEY]: CATALOG_MIGRATION_VALUE }),
) {
  render(
    <ProceduresProvider store={store}>
      <ProcedureCatalogScreen />
    </ProceduresProvider>,
  );
  return store;
}

async function waitForEnabledAdd(templateId: string) {
  await waitFor(() => {
    const add = screen.getByTestId(`catalog-add-${templateId}`);
    const disabled = add.props.disabled === true || add.props.accessibilityState?.disabled === true;
    expect(disabled).toBe(false);
  });
  return screen.getByTestId(`catalog-add-${templateId}`);
}

describe('ProcedureCatalogScreen', () => {
  beforeEach(() => {
    jest.mocked(router.push).mockClear();
    jest.mocked(router.replace).mockClear();
  });

  it('shows Ver and Adicionar without adopting when Ver is pressed', async () => {
    const store = renderCatalog();

    await waitFor(() => {
      expect(screen.getByTestId('procedure-catalog-screen')).toBeTruthy();
    });

    const viewButton = await screen.findByTestId(`catalog-view-${BUILTIN_CVP_ID}`);
    expect(screen.getByTestId(`catalog-add-${BUILTIN_CVP_ID}`)).toBeTruthy();
    expect(screen.getAllByTestId(/^catalog-view-/).length).toBeGreaterThan(0);

    fireEvent.press(viewButton);

    expect(router.push).toHaveBeenCalledWith(`/procedure/${BUILTIN_CVP_ID}`);
    expect(router.replace).not.toHaveBeenCalled();

    await waitFor(async () => {
      const raw = await store.getItem(STORAGE_KEY);
      const users = raw ? (JSON.parse(raw) as unknown[]) : [];
      expect(users).toHaveLength(0);
    });
  });

  it('keeps Ver available for already-adopted templates', async () => {
    const template = findCatalogTemplate(BUILTIN_SNG_ID)!;
    const store = createMemoryKeyValueStore({
      [CATALOG_MIGRATION_KEY]: CATALOG_MIGRATION_VALUE,
      [STORAGE_KEY]: JSON.stringify([adoptFromCatalog(template)]),
    });
    renderCatalog(store);

    await waitFor(() => {
      expect(screen.getByTestId(`catalog-view-${BUILTIN_SNG_ID}`)).toBeTruthy();
    });
    expect(screen.getByTestId(`catalog-already-added-${BUILTIN_SNG_ID}`)).toBeTruthy();
    expect(screen.queryByTestId(`catalog-add-${BUILTIN_SNG_ID}`)).toBeNull();

    fireEvent.press(screen.getByTestId(`catalog-view-${BUILTIN_SNG_ID}`));
    expect(router.push).toHaveBeenCalledWith(`/procedure/${BUILTIN_SNG_ID}`);
  });

  it('adds from Adicionar and navigates to the adopted user procedure', async () => {
    renderCatalog();

    const addButton = await waitForEnabledAdd(BUILTIN_CVP_ID);
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalled();
    });
    const target = jest.mocked(router.replace).mock.calls[0]?.[0] as string;
    expect(target).toMatch(/^\/procedure\/user-/);
    expect(router.push).not.toHaveBeenCalled();
  });
});
