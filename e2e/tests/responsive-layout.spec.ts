import { expect, test } from '@playwright/test';

test.describe('Responsive Layout', () => {
  const SECTION_IDS = [
    'section-classification',
    'section-compatibility',
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/medication/acetilcisteina');

    await expect(page.getByTestId('medication-title')).toBeVisible();
  });

  test('mobile: sections stack vertically', async ({ page }) => {
    await test.step('Set mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 812 });
    });

    await test.step('Verify sections are visible and stacked', async () => {
      const firstSection = page.getByTestId(SECTION_IDS[0]);

      const secondSection = page.getByTestId(SECTION_IDS[1]);

      await expect(firstSection).toBeVisible();

      await expect(secondSection).toBeVisible();

      const firstBox = await firstSection.boundingBox();

      const secondBox = await secondSection.boundingBox();

      expect(firstBox).not.toBeNull();

      expect(secondBox).not.toBeNull();

      if (firstBox && secondBox) {
        expect(secondBox.y).toBeGreaterThanOrEqual(firstBox.y + firstBox.height);

        expect(Math.abs(secondBox.x - firstBox.x)).toBeLessThan(20);
      }
    });
  });

  test('desktop: sections display side-by-side on wide screens', async ({ page }) => {
    await test.step('Set desktop viewport', async () => {
      await page.setViewportSize({ width: 1280, height: 800 });
    });

    await test.step('Verify sections are visible and side-by-side', async () => {
      const firstSection = page.getByTestId(SECTION_IDS[0]);

      const secondSection = page.getByTestId(SECTION_IDS[1]);

      await expect(firstSection).toBeVisible();

      await expect(secondSection).toBeVisible();

      const firstBox = await firstSection.boundingBox();

      const secondBox = await secondSection.boundingBox();

      expect(firstBox).not.toBeNull();

      expect(secondBox).not.toBeNull();

      if (firstBox && secondBox) {
        expect(
          firstBox.y < secondBox.y + secondBox.height &&
          firstBox.y + firstBox.height > secondBox.y
        ).toBe(true);

        expect(secondBox.x).toBeGreaterThan(firstBox.x);
      }
    });
  });
});
