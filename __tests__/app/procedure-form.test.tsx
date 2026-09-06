import React from 'react';
import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import ProcedureFormScreen from '@/app/procedure/form';
import { Colors } from '@/constants/Colors';
import { ProceduresProvider } from '@/context/ProceduresContext';
import { BUILTIN_CVP_ID } from '@/procedures/builtin';
import { STORAGE_KEY } from '@/procedures/procedures';
import { createMemoryKeyValueStore, type KeyValueStore } from '@/storage/types';
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

function installWindowStorageEvents() {
  const listeners = new Map<string, Array<(event: Event) => void>>();
  const previousAdd = window.addEventListener;
  const previousRemove = window.removeEventListener;
  const previousDispatch = window.dispatchEvent;

  window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject) => {
    const list = listeners.get(type) ?? [];
    if (typeof listener === 'function') {
      list.push(listener);
      listeners.set(type, list);
    }
  }) as typeof window.addEventListener;

  window.removeEventListener = ((type: string, listener: EventListenerOrEventListenerObject) => {
    listeners.set(
      type,
      (listeners.get(type) ?? []).filter((item) => item !== listener),
    );
  }) as typeof window.removeEventListener;

  window.dispatchEvent = ((event: Event) => {
    for (const listener of listeners.get(event.type) ?? []) {
      listener(event);
    }
    return true;
  }) as typeof window.dispatchEvent;

  return () => {
    window.addEventListener = previousAdd;
    window.removeEventListener = previousRemove;
    window.dispatchEvent = previousDispatch;
  };
}

function renderForm(params: { id?: string } = {}, store = createMemoryKeyValueStore()) {
  jest.mocked(useLocalSearchParams).mockReturnValue(params);
  render(
    <ProceduresProvider store={store}>
      <ProcedureFormScreen />
    </ProceduresProvider>,
  );
  return store;
}

async function waitForFormReady() {
  await waitFor(() => {
    const save = screen.getByTestId('procedure-form-save');
    const disabled =
      save.props.disabled === true || save.props.accessibilityState?.disabled === true;
    expect(disabled).toBe(false);
  });
}

describe('ProcedureFormScreen', () => {
  beforeEach(() => {
    jest.mocked(router.replace).mockClear();
    jest.mocked(router.back).mockClear();
    jest.mocked(useLocalSearchParams).mockReturnValue({});
  });

  it('creates a procedure and replaces to the new detail', async () => {
    renderForm();
    await waitForFormReady();

    fireEvent.changeText(
      screen.getByTestId('procedure-form-title'),
      'Lista de verificação de teste',
    );
    fireEvent.press(screen.getByTestId('procedure-form-save'));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalled();
    });
    const target = jest.mocked(router.replace).mock.calls[0]?.[0];
    expect(String(target)).toMatch(/^\/procedure\/user-/);
    expect(router.back).not.toHaveBeenCalled();
  });

  it('goes back after editing an existing user procedure', async () => {
    const store = createMemoryKeyValueStore({
      [STORAGE_KEY]: JSON.stringify([storedUser]),
    });
    renderForm({ id: storedUser.id }, store);

    await waitFor(() => {
      expect(screen.getByTestId('procedure-form-title').props.value).toBe('Meu procedimento');
    });
    await waitForFormReady();

    fireEvent.changeText(screen.getByTestId('procedure-form-title'), 'Meu procedimento editado');
    fireEvent.press(screen.getByTestId('procedure-form-save'));

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('does not navigate when the title is empty', async () => {
    renderForm();
    await waitForFormReady();

    fireEvent.press(screen.getByTestId('procedure-form-save'));

    expect(screen.getByTestId('procedure-form-error')).toBeTruthy();
    expect(screen.getByTestId('procedure-form-error').props.children).toBe(
      i18n.t('procedures.validationTitle'),
    );
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.back).not.toHaveBeenCalled();
  });

  it('shows loading then not-found for an unknown id, never a blank create form', async () => {
    let release: ((value: string | null) => void) | undefined;
    const store: KeyValueStore = {
      getItem: () =>
        new Promise((resolve) => {
          release = resolve;
        }),
      setItem: async () => {},
    };

    renderForm({ id: 'user-missing' }, store);

    expect(screen.getByTestId('procedure-form-loading')).toBeTruthy();
    expect(screen.queryByTestId('procedure-form')).toBeNull();
    expect(screen.queryByTestId('procedure-not-found')).toBeNull();

    if (!release) {
      throw new Error('getItem was not called');
    }
    release(null);

    await waitFor(() => {
      expect(screen.getByTestId('procedure-not-found')).toBeTruthy();
    });
    expect(screen.queryByTestId('procedure-form')).toBeNull();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('shows not-found instead of a blank create form for an unknown id', async () => {
    renderForm({ id: 'user-missing' });

    await waitFor(() => {
      expect(screen.getByTestId('procedure-not-found')).toBeTruthy();
    });
    expect(screen.queryByTestId('procedure-form')).toBeNull();
  });

  it('does not show the create form for a built-in id', async () => {
    renderForm({ id: BUILTIN_CVP_ID });

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith(`/procedure/${BUILTIN_CVP_ID}`);
    });
    expect(screen.queryByTestId('procedure-form')).toBeNull();
  });

  it('disables save and shows persist error when storage is unavailable', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const store: KeyValueStore = {
      getItem: async () => {
        throw new Error('disk unreadable');
      },
      setItem: async () => {},
    };

    try {
      renderForm({}, store);

      await waitFor(() => {
        expect(screen.getByTestId('procedure-form-persist-error')).toBeTruthy();
      });
      expect(screen.getByText(i18n.t('procedures.persistError'))).toBeTruthy();

      const save = screen.getByTestId('procedure-form-save');
      const disabled =
        save.props.disabled === true || save.props.accessibilityState?.disabled === true;
      expect(disabled).toBe(true);

      fireEvent.changeText(screen.getByTestId('procedure-form-title'), 'Não deve gravar');
      fireEvent.press(save);
      expect(router.replace).not.toHaveBeenCalled();
      expect(router.back).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('preserves dirty form fields when another tab writes storage', async () => {
    const restore = installWindowStorageEvents();
    try {
      const store = createMemoryKeyValueStore({
        [STORAGE_KEY]: JSON.stringify([storedUser]),
      });
      renderForm({ id: storedUser.id }, store);

      await waitFor(() => {
        expect(screen.getByTestId('procedure-form-title').props.value).toBe('Meu procedimento');
      });

      fireEvent.changeText(screen.getByTestId('procedure-form-title'), 'Título por guardar');
      fireEvent.changeText(screen.getByTestId('procedure-form-materials-item-0'), 'Soro');

      const event = new Event('storage');
      Object.assign(event, {
        key: STORAGE_KEY,
        newValue: JSON.stringify([
          {
            ...storedUser,
            title: 'Escrito noutra aba',
            materials: ['Disco'],
          },
        ]),
      });
      act(() => {
        window.dispatchEvent(event);
      });

      expect(screen.getByTestId('procedure-form-title').props.value).toBe('Título por guardar');
      expect(screen.getByTestId('procedure-form-materials-item-0').props.value).toBe('Soro');
    } finally {
      restore();
    }
  });

  it('labels checklist inputs with section and 1-based index', async () => {
    renderForm();
    await waitForFormReady();

    expect(screen.getByTestId('procedure-form-title').props.accessibilityLabel).toBe(
      i18n.t('procedures.titleLabel'),
    );
    expect(screen.getByTestId('procedure-form-materials-item-0').props.accessibilityLabel).toBe(
      'Material 1',
    );
    expect(screen.getByTestId('procedure-form-steps-item-0').props.accessibilityLabel).toBe(
      'Passo 1',
    );
    expect(screen.getByTestId('procedure-form-attention-item-0').props.accessibilityLabel).toBe(
      'Atenção 1',
    );
    expect(screen.getByTestId('procedure-form-materials-remove-0').props.accessibilityLabel).toBe(
      'Remover Material 1',
    );
    expect(screen.getByTestId('procedure-form-steps-remove-0').props.accessibilityLabel).toBe(
      'Remover Passo 1',
    );
    expect(screen.getByTestId('procedure-form-attention-remove-0').props.accessibilityLabel).toBe(
      'Remover Atenção 1',
    );

    fireEvent.press(screen.getByTestId('procedure-form-materials-add'));
    expect(screen.getByTestId('procedure-form-materials-item-1').props.accessibilityLabel).toBe(
      'Material 2',
    );
    expect(screen.getByTestId('procedure-form-materials-remove-1').props.accessibilityLabel).toBe(
      'Remover Material 2',
    );
  });

  it('uses high-contrast save colors instead of white on tint', async () => {
    renderForm();
    await waitForFormReady();

    const save = screen.getByTestId('procedure-form-save');
    expect(StyleSheet.flatten(save.props.style).backgroundColor).toBe(Colors.light.sky);
    const label = screen.getByText(i18n.t('procedures.save'));
    expect(StyleSheet.flatten(label.props.style).color).toBe(Colors.light.textDark);
  });

  it('gives add and remove checklist controls a 44px touch target', async () => {
    renderForm();
    await waitForFormReady();

    const add = screen.getByTestId('procedure-form-materials-add');
    const remove = screen.getByTestId('procedure-form-materials-remove-0');
    expect(StyleSheet.flatten(add.props.style).minHeight).toBe(44);
    expect(StyleSheet.flatten(remove.props.style).minHeight).toBe(44);
  });
});
