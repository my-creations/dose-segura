import { expect, test } from '@playwright/test';

import medsData from '../../data/meds.json';

test.describe('Search Medication', () => {
  const medication = medsData.medications.acetilcisteina;

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

  test('renders medication detail content from the JSON source', async ({ page }) => {
    await page.goto(`/medication/${medication.id}`);

    await expect(page.getByTestId('medication-title')).toHaveText(medication.name);
    await expect(page.getByText(medication.aliases[0], { exact: true })).toBeVisible();

    await expect(
      page
        .getByTestId('section-classification')
        .getByText(medication.classification[0], { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByTestId('section-classification')
        .getByText(medication.classification[1], { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByTestId('section-compatibility')
        .getByText(medication.compatibility[0], { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .getByTestId('section-presentationAndStorage')
        .getByText(medication.presentationAndStorage[0], { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByTestId('section-preparation').getByText(medication.preparation[0], { exact: true }),
    ).toBeVisible();
  });
});
