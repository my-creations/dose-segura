import { expect, test } from '@playwright/test';

test.describe('Search Medication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('searches for a medication and navigates to detail screen', async ({ page }) => {
    await test.step('Search for medication', async () => {
      const searchInput = page.getByTestId('search-input');

      await expect(searchInput).toBeVisible();
      await searchInput.fill('Bicarb');
    });

    await test.step('Select medication and verify details', async () => {
      const medicationResult = page.getByTestId('medication-card-bicarbonato-de-sodio');

      await expect(medicationResult).toBeVisible();
      await medicationResult.click();

      await expect(page).toHaveURL(/\/medication\//);
      await expect(page.getByTestId('medication-title')).toBeVisible();
    });
  });
});