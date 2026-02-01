import { expect, test } from '@playwright/test';

test.describe('Theme support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('adapts to light and dark mode', async ({ page }) => {
    const homeScreen = page.getByTestId('home-screen');

    await test.step('Start with light mode', async () => {
      await page.emulateMedia({ colorScheme: 'light' });
    });

    await test.step('Check background color for light mode', async () => {
      await expect(homeScreen).toBeVisible();
      
      expect(await homeScreen.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      })).toBe('rgb(255, 249, 249)');
    });

    await test.step('Switch to dark mode', async () => {
      await page.emulateMedia({ colorScheme: 'dark' });
    });
    
    await test.step('Verify background color changes to dark mode', async () => {
      await expect(async () => {
        expect(await homeScreen.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        })).toBe('rgb(21, 23, 24)');
      }).toPass();
    });
  });
});