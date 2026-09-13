import React from 'react';
import { render, screen } from '@testing-library/react-native';

import NotFoundScreen from '@/app/+not-found';
import { SEO } from '@/constants/Seo';
import { Strings } from '@/constants/Strings';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

describe('NotFoundScreen', () => {
  it('renders branded copy and a home CTA', () => {
    render(<NotFoundScreen />);

    expect(screen.getByTestId('not-found-screen')).toBeTruthy();
    expect(screen.getByText(SEO.siteName)).toBeTruthy();
    expect(screen.getByTestId('not-found-title')).toBeTruthy();
    expect(screen.getByText(Strings.pt.notFound.title)).toBeTruthy();
    expect(screen.getByText(Strings.pt.notFound.message)).toBeTruthy();
    expect(screen.getByTestId('not-found-home-link')).toBeTruthy();
    expect(screen.getByText(Strings.pt.notFound.goHome)).toBeTruthy();
  });
});
