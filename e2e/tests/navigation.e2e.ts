import { expect, test } from '@playwright/test';

import { Strings } from '../../constants/Strings';
import medsData from '../../data/meds.json';

const medicationId = 'bicarbonato-de-sodio';
const medication = medsData.medications[medicationId];

test.describe('Navigation', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('navigates between the main tabs', async ({ page }) => {
    const medicationsTab = page.getByRole('tab', {
      name: new RegExp(Strings.pt.navigation.medications, 'i'),
    });
    const favoritesTab = page.getByRole('tab', {
      name: new RegExp(Strings.pt.navigation.favorites, 'i'),
    });
    const calculationsTab = page.getByRole('tab', {
      name: new RegExp(Strings.pt.navigation.calculations, 'i'),
    });
    const settingsTab = page.getByRole('tab', {
      name: new RegExp(Strings.pt.navigation.settings, 'i'),
    });

    await expect(medicationsTab).toHaveAttribute('aria-selected', 'true');

    await favoritesTab.click();
    await expect(page).toHaveURL(/\/favorites$/);
    await expect(page.getByTestId('favorites-screen')).toBeVisible();
    await expect(favoritesTab).toHaveAttribute('aria-selected', 'true');

    await calculationsTab.click();
    await expect(page).toHaveURL(/\/calculations$/);
    await expect(page.getByTestId('calculations-screen')).toBeVisible();
    await expect(calculationsTab).toHaveAttribute('aria-selected', 'true');

    await settingsTab.click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByTestId('settings-screen')).toBeVisible();
    await expect(settingsTab).toHaveAttribute('aria-selected', 'true');

    await medicationsTab.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await expect(medicationsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('returns from Medication Details to the originating search state', async ({ page }) => {
    const search = page.getByTestId('search-input');
    await search.fill('Bicarb');
    await page.getByTestId(`medication-card-${medicationId}`).click();

    await expect(page).toHaveURL(new RegExp(`/medication/${medicationId}$`));
    await expect(page.getByTestId('medication-title')).toHaveText(medication.name);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    const homeScreen = page.getByTestId('home-screen').filter({ visible: true });
    await expect(homeScreen).toBeVisible();
    await expect(homeScreen.getByTestId('search-input')).toHaveValue('Bicarb');
    await expect(homeScreen.getByTestId(`medication-card-${medicationId}`)).toBeVisible();
  });

  test('returns from Medication Details to the Favorites List', async ({ page }) => {
    await page.getByTestId('search-input').fill('Bicarb');
    const summary = page.getByTestId(`medication-card-${medicationId}`);
    await summary.getByTestId('favorite-button').click();

    await page.getByRole('tab', { name: new RegExp(Strings.pt.navigation.favorites, 'i') }).click();
    await expect(page).toHaveURL(/\/favorites$/);
    await page
      .getByTestId('favorites-screen')
      .getByTestId(`medication-card-${medicationId}`)
      .click();

    await expect(page).toHaveURL(new RegExp(`/medication/${medicationId}$`));
    await page.goBack();
    await expect(page).toHaveURL(/\/favorites$/);
    const favoritesScreen = page.getByTestId('favorites-screen').filter({ visible: true });
    await expect(favoritesScreen).toBeVisible();
    await expect(favoritesScreen.getByTestId(`medication-card-${medicationId}`)).toBeVisible();
  });

  test('supports a valid Medication Detail deep link and reload', async ({ page }) => {
    await page.goto('/medication/acetilcisteina');
    await expect(page.getByTestId('medication-detail')).toBeVisible();
    await expect(page.getByTestId('medication-title')).toHaveText('Acetilcisteína');

    await page.reload();
    await expect(page).toHaveURL(/\/medication\/acetilcisteina$/);
    await expect(page.getByTestId('medication-title')).toHaveText('Acetilcisteína');
  });

  test('handles an unknown Medication Id and returns home', async ({ page }) => {
    await page.goto('/medication/not-a-real-medication-id');

    await expect(page.getByTestId('medication-not-found')).toContainText(
      Strings.pt.common.medicationNotFound,
    );
    await page.getByTestId('medication-not-found-back').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('home-screen').filter({ visible: true })).toBeVisible();
  });

  test('handles an unknown route and navigates home', async ({ page }) => {
    await page.goto('/does-not-exist');

    await expect(page.getByTestId('not-found-screen')).toBeVisible();
    await page.getByTestId('not-found-home-link').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('home-screen').filter({ visible: true })).toBeVisible();
  });
});
