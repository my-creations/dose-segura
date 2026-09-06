import React from 'react';
import { Alert, StyleSheet } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import ProcedureDetailScreen from '@/app/procedure/[id]';
import { Colors } from '@/constants/Colors';
import { ProceduresProvider } from '@/context/ProceduresContext';
import { BUILTIN_CVP_ID } from '@/procedures/builtin';
import { STORAGE_KEY } from '@/procedures/procedures';
import { createMemoryKeyValueStore } from '@/storage/types';
import type { Procedure } from '@/types/procedure';
import i18n from '@/utils/i18n';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

const storedUser: Procedure = {
  id: 'user-stored',
  title: 'Meu procedimento',
  materials: ['Luvas'],
  steps: ['Identificar o doente'],
  attention: ['Protocolo local'],
  source: 'user',
  updatedAt: '2026-09-02T00:00:00.000Z',
};

function renderDetail(id: string, store = createMemoryKeyValueStore()) {
  jest.mocked(useLocalSearchParams).mockReturnValue({ id });
  render(
    <ProceduresProvider store={store}>
      <ProcedureDetailScreen />
    </ProceduresProvider>,
  );
  return store;
}

describe('ProcedureDetailScreen', () => {
  beforeEach(() => {
    jest.mocked(router.replace).mockClear();
    jest.mocked(router.back).mockClear();
    jest.mocked(router.push).mockClear();
    jest.mocked(useLocalSearchParams).mockReturnValue({});
  });

  it('renders a built-in starter with the included badge and no edit or delete', async () => {
    renderDetail(BUILTIN_CVP_ID);

    await waitFor(() => {
      expect(screen.getByTestId('procedure-detail')).toBeTruthy();
    });
    expect(screen.getByTestId('procedure-title').props.children).toBe(
      'Cateterismo venoso periférico',
    );
    expect(screen.getByTestId('procedure-builtin-badge')).toBeTruthy();
    expect(screen.queryByTestId('procedure-user-badge')).toBeNull();
    expect(screen.getByTestId('procedure-duplicate')).toBeTruthy();
    expect(screen.queryByTestId('procedure-edit')).toBeNull();
    expect(screen.queryByTestId('procedure-delete')).toBeNull();
  });

  it('renders a user procedure badge and dismisses with back after delete', async () => {
    const store = createMemoryKeyValueStore({
      [STORAGE_KEY]: JSON.stringify([storedUser]),
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      const confirm = buttons?.find((button) => button.style === 'destructive');
      confirm?.onPress?.();
    });
    const previousConfirm = window.confirm;
    window.confirm = () => true;

    try {
      renderDetail(storedUser.id, store);

      await waitFor(() => {
        expect(screen.getByTestId('procedure-detail')).toBeTruthy();
      });
      expect(screen.getByTestId('procedure-title').props.children).toBe('Meu procedimento');
      expect(screen.getByTestId('procedure-user-badge')).toBeTruthy();
      expect(screen.queryByTestId('procedure-builtin-badge')).toBeNull();
      expect(screen.getByTestId('procedure-edit')).toBeTruthy();

      fireEvent.press(screen.getByTestId('procedure-delete'));

      expect(router.back).toHaveBeenCalledTimes(1);
      expect(router.replace).not.toHaveBeenCalled();
    } finally {
      window.confirm = previousConfirm;
      alertSpy.mockRestore();
    }
  });

  it('shows not-found for an unknown id', async () => {
    renderDetail('user-missing');

    await waitFor(() => {
      expect(screen.getByTestId('procedure-not-found')).toBeTruthy();
    });
    expect(screen.getByText(i18n.t('procedures.notFound'))).toBeTruthy();
    expect(screen.queryByTestId('procedure-detail')).toBeNull();

    const back = screen.getByTestId('procedure-not-found-back');
    expect(StyleSheet.flatten(back.props.style).backgroundColor).toBe(Colors.light.sky);
    const label = screen.getByText(i18n.t('common.back'));
    expect(StyleSheet.flatten(label.props.style).color).toBe(Colors.light.textDark);
  });
});
