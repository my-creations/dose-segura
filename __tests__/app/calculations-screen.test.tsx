import React from 'react';
import { Keyboard, StyleSheet } from 'react-native';

import { fireEvent, render } from '@testing-library/react-native';

import CalculationsScreen from '@/app/(tabs)/calculations';
import { Colors } from '@/constants/Colors';
import { Strings } from '@/constants/Strings';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

const copy = Strings.pt.calculations;

describe('CalculationsScreen', () => {
  it('renders the guided helper, chips, and persistent disclaimer', () => {
    const { getByTestId, getByText } = render(<CalculationsScreen />);

    expect(getByTestId('calculations-screen')).toBeTruthy();
    expect(getByText(copy.intro)).toBeTruthy();
    expect(getByTestId('calculation-mode-dose-by-weight')).toBeTruthy();
    expect(getByTestId('calculation-mode-volume')).toBeTruthy();
    expect(getByTestId('calculation-mode-mg-per-kg')).toBeTruthy();
    expect(getByTestId('calculation-input-dose-ref')).toBeTruthy();
    expect(getByTestId('calculation-disclaimer')).toBeTruthy();
    expect(getByText(copy.disclaimer)).toBeTruthy();
  });

  it('shows a dose-by-weight result with units and the substituted formula', () => {
    const { getByTestId, queryByTestId } = render(<CalculationsScreen />);

    expect(queryByTestId('calculation-result')).toBeNull();

    fireEvent.changeText(getByTestId('calculation-input-dose-ref'), '100');
    fireEvent.changeText(getByTestId('calculation-input-weight-ref'), '70');
    fireEvent.changeText(getByTestId('calculation-input-patient-weight'), '7,5');

    expect(getByTestId('calculation-result-value').props.children).toBe('10,7143');
    expect(getByTestId('calculation-result-unit').props.children).toBe('mg');
    expect(getByTestId('calculation-result-formula').props.children).toBe(
      '100 mg × 7,5 kg ÷ 70 kg = 10,7143 mg',
    );
  });

  it('does not show Infinity when a required value is zero', () => {
    const { getByTestId, queryByTestId, getByText } = render(<CalculationsScreen />);

    fireEvent.changeText(getByTestId('calculation-input-dose-ref'), '100');
    fireEvent.changeText(getByTestId('calculation-input-weight-ref'), '0');
    fireEvent.changeText(getByTestId('calculation-input-patient-weight'), '7');

    expect(queryByTestId('calculation-result')).toBeNull();
    expect(getByTestId('calculation-error')).toBeTruthy();
    expect(getByText(copy.errors.zeroOrNegative)).toBeTruthy();
  });

  it('computes volume to draw after switching mode', () => {
    const { getByTestId } = render(<CalculationsScreen />);

    fireEvent.press(getByTestId('calculation-mode-volume'));
    fireEvent.changeText(getByTestId('calculation-input-prescribed-dose'), '15');
    fireEvent.changeText(getByTestId('calculation-input-concentration'), '5');

    expect(getByTestId('calculation-result-value').props.children).toBe('3');
    expect(getByTestId('calculation-result-unit').props.children).toBe('mL');
    expect(getByTestId('calculation-result-formula').props.children).toBe('15 mg ÷ 5 mg/mL = 3 mL');
  });

  it('keeps inputs when the already-selected mode chip is tapped again', () => {
    const { getByTestId } = render(<CalculationsScreen />);

    fireEvent.changeText(getByTestId('calculation-input-dose-ref'), '100');
    fireEvent.changeText(getByTestId('calculation-input-weight-ref'), '70');
    fireEvent.changeText(getByTestId('calculation-input-patient-weight'), '7,5');

    fireEvent.press(getByTestId('calculation-mode-dose-by-weight'));

    expect(getByTestId('calculation-input-dose-ref').props.value).toBe('100');
    expect(getByTestId('calculation-input-weight-ref').props.value).toBe('70');
    expect(getByTestId('calculation-input-patient-weight').props.value).toBe('7,5');
    expect(getByTestId('calculation-result-value').props.children).toBe('10,7143');
  });

  it('gives each mode chip a 44px minimum touch target and a high-contrast selected label', () => {
    const { getByTestId, getByText } = render(<CalculationsScreen />);

    for (const testID of [
      'calculation-mode-dose-by-weight',
      'calculation-mode-volume',
      'calculation-mode-mg-per-kg',
    ]) {
      expect(StyleSheet.flatten(getByTestId(testID).props.style).minHeight).toBe(44);
    }

    const selectedChip = StyleSheet.flatten(
      getByTestId('calculation-mode-dose-by-weight').props.style,
    );
    expect(selectedChip.backgroundColor).toBe(Colors.light.tint + '28');
    expect(selectedChip.borderColor).toBe(Colors.light.tint);

    const selectedLabel = StyleSheet.flatten(getByText(copy.modes.doseByWeight).props.style);
    expect(selectedLabel.color).toBe(Colors.light.textDark);
    expect(selectedLabel.color).not.toBe(Colors.light.tint);
  });

  it('renders input and result unit labels with high-contrast text, not tint', () => {
    const { getByTestId, getAllByText } = render(<CalculationsScreen />);

    const inputMgUnit = getAllByText(copy.units.mg).find((node) => {
      const style = StyleSheet.flatten(node.props.style);
      return style?.fontSize === 16;
    });
    expect(inputMgUnit).toBeTruthy();
    expect(StyleSheet.flatten(inputMgUnit!.props.style).color).toBe(Colors.light.textDark);
    expect(StyleSheet.flatten(inputMgUnit!.props.style).color).not.toBe(Colors.light.tint);

    fireEvent.changeText(getByTestId('calculation-input-dose-ref'), '100');
    fireEvent.changeText(getByTestId('calculation-input-weight-ref'), '70');
    fireEvent.changeText(getByTestId('calculation-input-patient-weight'), '7,5');

    const resultUnit = StyleSheet.flatten(getByTestId('calculation-result-unit').props.style);
    expect(resultUnit.color).toBe(Colors.light.textDark);
    expect(resultUnit.color).not.toBe(Colors.light.tint);
  });

  it('dismisses the keyboard when Next is pressed on an empty optional field', () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => {});

    try {
      const { getByTestId } = render(<CalculationsScreen />);

      fireEvent.press(getByTestId('calculation-mode-mg-per-kg'));
      fireEvent.changeText(getByTestId('calculation-input-dose-per-kg'), '10');
      fireEvent.changeText(getByTestId('calculation-input-patient-weight'), '3,2');
      fireEvent(getByTestId('calculation-input-concentration'), 'focus');
      dismiss.mockClear();

      fireEvent.press(getByTestId('calculation-next-button'));

      expect(dismiss).toHaveBeenCalled();
      expect(getByTestId('calculation-input-concentration').props.value).toBe('');
      expect(getByTestId('calculation-result-value').props.children).toBe('32');
    } finally {
      dismiss.mockRestore();
    }
  });
});
