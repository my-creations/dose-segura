import React from 'react';

import { fireEvent, render } from '@testing-library/react-native';

import { MedicationCard } from '@/components/MedicationCard';
import { Medication } from '@/types/medication';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));



const baseMedication: Medication = {
  id: 'acetilcisteina',
  name: 'Acetilcisteína',
  aliases: ['NAC', 'Fluimucil', 'N-acetilcisteína'],
  highRisk: true,
  classification: ['Mucolítico', 'Expectorante', 'Outra'],
  compatibility: [],
  presentationAndStorage: [],
  preparation: [],
  administration: [],
  stability: [],
  contraindicationsAndPrecautions: [],
  nursingCare: [],
};

describe('MedicationCard', () => {
  it('renders medication name, aliases, classification, and high-risk badge', () => {
    const { getByText, queryByText } = render(
      <MedicationCard medication={baseMedication} isFavorite={false} />
    );

    expect(getByText('Acetilcisteína')).toBeTruthy();
    expect(getByText('NAC, Fluimucil...')).toBeTruthy();
    expect(getByText('Mucolítico')).toBeTruthy();
    expect(getByText('Expectorante')).toBeTruthy();
    expect(queryByText('Outra')).toBeNull();
    expect(getByText('Alto Risco')).toBeTruthy();
  });

  it('does not render high-risk badge when medication is not high risk', () => {
    const medication = { ...baseMedication, highRisk: false };

    const { queryByText } = render(
      <MedicationCard medication={medication} isFavorite={false} />
    );

    expect(queryByText('Alto Risco')).toBeNull();
  });

  it('calls onToggleFavorite when favorite button is pressed', () => {
    const onToggleFavorite = jest.fn();

    const { getByTestId } = render(
      <MedicationCard
        medication={baseMedication}
        isFavorite={false}
        onToggleFavorite={onToggleFavorite}
      />
    );

    const favoriteButton = getByTestId('favorite-button');

    fireEvent.press(favoriteButton);

    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });
});