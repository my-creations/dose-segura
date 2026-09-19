import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { MedicationCard } from '@/components/MedicationCard';
import { ProcedureCard } from '@/components/ProcedureCard';
import type { MedicationSummary } from '@/types/medication';
import type { Procedure } from '@/types/procedure';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

const medication: MedicationSummary = {
  id: 'acetilcisteina',
  name: 'Acetilcisteína',
  aliases: ['NAC'],
  highRisk: false,
  classification: ['Expetorante'],
};

const procedure: Procedure = {
  id: 'cvp',
  title: 'Cateter venoso periférico',
  materials: ['Luvas'],
  steps: ['Higienizar as mãos'],
  attention: ['Vigiar sinais de flebite'],
  source: 'user',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

/**
 * `Link` + `asChild` merges the child's style with an object spread (Radix Slot), so the child
 * must receive a flat style object. A style function becomes `{}` (styles silently dropped on
 * web) and an array becomes `{0: ..., 1: ...}` (RN-web crash).
 *
 * The jest `expo-router` mock renders `children` directly, so the merge does not happen here —
 * these assertions lock the constraint at the source instead.
 */
describe.each([
  [
    'MedicationCard',
    () => <MedicationCard medication={medication} />,
    'medication-card-acetilcisteina',
  ],
  ['ProcedureCard', () => <ProcedureCard procedure={procedure} />, 'procedure-card-cvp'],
] as const)('%s', (_name, renderCard, testID) => {
  it('passes a flat style object to the pressable inside Link asChild', () => {
    render(renderCard());

    const style = screen.getByTestId(testID).props.style;

    expect(typeof style).toBe('object');
    expect(Array.isArray(style)).toBe(false);
    // The container margins must survive the Slot merge, or cards go flush to the screen edge.
    expect(StyleSheet.flatten(style).marginHorizontal).toBe(16);
  });

  it('keeps pressed feedback via state instead of a style callback', () => {
    render(renderCard());
    const card = screen.getByTestId(testID);

    expect(StyleSheet.flatten(card.props.style).opacity).toBeUndefined();

    fireEvent(card, 'pressIn');
    expect(StyleSheet.flatten(screen.getByTestId(testID).props.style).opacity).toBe(0.8);

    fireEvent(screen.getByTestId(testID), 'pressOut');
    expect(StyleSheet.flatten(screen.getByTestId(testID).props.style).opacity).toBeUndefined();
  });
});
