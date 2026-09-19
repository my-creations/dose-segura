import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, usePathname } from 'expo-router';

import NotFoundScreen from '@/app/+not-found';
import { SEO } from '@/constants/Seo';
import { Strings } from '@/constants/Strings';

jest.mock('@/hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

const mockPathname = usePathname as jest.Mock;
const mockCanGoBack = router.canGoBack as jest.Mock;
const mockBack = router.back as jest.Mock;

describe('NotFoundScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/caminho-inexistente');
    mockCanGoBack.mockReturnValue(true);
  });

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

  it('shows the requested path that failed', () => {
    render(<NotFoundScreen />);

    expect(screen.getByTestId('not-found-path')).toBeTruthy();
    expect(screen.getByText(Strings.pt.notFound.requestedPathLabel)).toBeTruthy();
    expect(screen.getByText('/caminho-inexistente')).toBeTruthy();
  });

  it('goes back when there is history to return to', () => {
    render(<NotFoundScreen />);

    fireEvent.press(screen.getByTestId('not-found-back-button'));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('hides the back button when there is no history', () => {
    mockCanGoBack.mockReturnValue(false);

    render(<NotFoundScreen />);

    expect(screen.queryByTestId('not-found-back-button')).toBeNull();
    expect(screen.getByTestId('not-found-home-link')).toBeTruthy();
  });
});
