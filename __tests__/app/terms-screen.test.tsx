import React from 'react';
import { render, screen } from '@testing-library/react-native';

import TermsScreen from '@/app/terms';
import { Strings } from '@/constants/Strings';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

describe('TermsScreen', () => {
  it('renders terms and medical disclaimer copy', () => {
    render(<TermsScreen />);

    expect(screen.getByTestId('terms-screen')).toBeTruthy();
    expect(screen.getByText(Strings.pt.terms.lede)).toBeTruthy();
    expect(screen.getByText(Strings.pt.terms.purposeTitle)).toBeTruthy();
    expect(screen.getByText(Strings.pt.terms.purposeBody)).toBeTruthy();
    expect(screen.getByTestId('terms-contact-email')).toBeTruthy();
    expect(screen.getByText('pmrobalo@gmail.com')).toBeTruthy();
  });
});
