import { expect, test } from '@playwright/test';

import { Strings } from '../../constants/Strings';

test.describe('Favorites flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('adds and removes a medication from favorites', async ({ page }) => {
    await test.step('Search for medication', async () => {
      const searchInput = page.getByTestId('search-input');

      await expect(searchInput).toBeVisible();
      await searchInput.fill('Bicarb');
    });

    await test.step('Add medication to favorites', async () => {
      const medicationCard = page.getByTestId('home-screen').getByTestId('medication-card-bicarbonato-de-sodio');

      await expect(medicationCard).toBeVisible();

      const favoriteButton = medicationCard.getByTestId('favorite-button');

      await expect(favoriteButton).toBeVisible();

      await favoriteButton.click();
    });

    await test.step('Navigate to favorites tab', async () => {
      const favoritesTab = page.getByText(Strings.pt.navigation.favorites);

      await expect(favoritesTab).toBeVisible();
      await favoritesTab.click();
      await expect(page).toHaveURL(/\/favorites/);
    });

    await test.step('Verify medication is in favorites and remove it', async () => {
      const favoriteCard = page.getByTestId('favorites-screen').getByTestId('medication-card-bicarbonato-de-sodio');

      await expect(favoriteCard).toBeVisible();

      await favoriteCard.getByTestId('favorite-button').click();

      await expect(favoriteCard).not.toBeVisible();
    });

    await test.step('Verify empty state', async () => {
      await expect(page.getByText(Strings.pt.favorites.emptyTitle)).toBeVisible();
    });
  });
});