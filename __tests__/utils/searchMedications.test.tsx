// Tests for search utility
import React, { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react-native';

import { MedicationsContextType, MedicationsProvider, useMedications } from '@/context/MedicationsContext';
import { Medication } from '@/types/medication';

describe('searchMedications', () => {
  function renderWithProvider(onReady: (value: MedicationsContextType) => void) {
    function TestHarness() {
      const contextValue = useMedications();

      useEffect(() => {
        onReady(contextValue);
      }, [contextValue]);

      return null;
    }

    render(
      <MedicationsProvider>
        <TestHarness />
      </MedicationsProvider>
    );
  }

  it('returns all medications for an empty query', async () => {
    let contextValue: MedicationsContextType | null = null;

    renderWithProvider((value) => {
      contextValue = value;
    });

    await waitFor(() => {
      expect(contextValue).not.toBeNull();
    });

    expect(contextValue!.searchMedications('')).toHaveLength(contextValue!.medications.length);
    expect(contextValue!.searchMedications('   ')).toHaveLength(contextValue!.medications.length);
  });

  it('matches medication names regardless of case and accents', async () => {
    let contextValue: MedicationsContextType | null = null;

    renderWithProvider((value) => {
      contextValue = value;
    });

    await waitFor(() => {
      expect(contextValue).not.toBeNull();
    });

    const results = contextValue!.searchMedications('acetilcisteina');

    expect(results.some((med: Medication) => med.id === 'acetilcisteina')).toBe(true);
  });

  it('matches medication aliases', async () => {
    let contextValue: MedicationsContextType | null = null;

    renderWithProvider((value) => {
      contextValue = value;
    });

    await waitFor(() => {
      expect(contextValue).not.toBeNull();
    });

    const results = contextValue!.searchMedications('nac');

    expect(results.some((med: Medication) => med.id === 'acetilcisteina')).toBe(true);
  });

  it('returns no results when query does not match', async () => {
    let contextValue: MedicationsContextType | null = null;

    renderWithProvider((value) => {
      contextValue = value;
    });

    await waitFor(() => {
      expect(contextValue).not.toBeNull();
    });

    const results = contextValue!.searchMedications('medicamento-inexistente-xyz');

    expect(results).toHaveLength(0);
  });
});