// Tests for search utility
import React, { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react-native';

import medsData from '@/data/meds.json';
import { MedicationsContextType, MedicationsProvider, useMedications } from '@/context/MedicationsContext';
import { MedicationSummary, MedicationsData } from '@/types/medication';

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

    expect(results.some((med: MedicationSummary) => med.id === 'acetilcisteina')).toBe(true);
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

    expect(results.some((med: MedicationSummary) => med.id === 'acetilcisteina')).toBe(true);
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

  it('loads medication details on demand', async () => {
    let contextValue: MedicationsContextType | null = null;

    renderWithProvider((value) => {
      contextValue = value;
    });

    await waitFor(() => {
      expect(contextValue).not.toBeNull();
    });

    await expect(contextValue!.getMedicationDetails('acetilcisteina')).resolves.toMatchObject({
      id: 'acetilcisteina',
      name: 'Acetilcisteína',
    });
  });

  it('returns medication details that match the source JSON record', async () => {
    let contextValue: MedicationsContextType | null = null;

    renderWithProvider((value) => {
      contextValue = value;
    });

    await waitFor(() => {
      expect(contextValue).not.toBeNull();
    });

    const expectedMedication = (medsData as MedicationsData).medications.acetilcisteina;
    const actualMedication = await contextValue!.getMedicationDetails('acetilcisteina');

    expect(actualMedication).toEqual(expectedMedication);
  });
});
