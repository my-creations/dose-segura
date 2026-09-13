import React from 'react';
import { render, screen } from '@testing-library/react-native';

import PrivacyScreen from '@/app/privacy';
import { Strings } from '@/constants/Strings';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

describe('PrivacyScreen', () => {
  it('renders privacy copy including no-analytics v1 statement', () => {
    render(<PrivacyScreen />);

    expect(screen.getByTestId('privacy-screen')).toBeTruthy();
    expect(screen.getByText(Strings.pt.privacy.lede)).toBeTruthy();
    expect(screen.getByText(Strings.pt.privacy.analyticsTitle)).toBeTruthy();
    expect(screen.getByText(Strings.pt.privacy.analyticsBody)).toBeTruthy();
    expect(screen.getByTestId('privacy-contact-email')).toBeTruthy();
    expect(screen.getByText('pmrobalo@gmail.com')).toBeTruthy();
  });
});
