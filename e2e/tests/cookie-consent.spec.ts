import { expect, test } from '@playwright/test';

import { Strings } from '../../constants/Strings';

test.describe('Cookie consent and advertising toggle', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const isMobile = !!testInfo.project.use?.isMobile;
    test.skip(isMobile, 'Desktop-only for deterministic consent modal and settings layout checks');

    await page.addInitScript(() => {
      window.localStorage.removeItem('dose_segura_cookie_consent_v1');
    });

    await page.goto('/');
  });

  test('shows consent modal on first load and persists acceptance', async ({ page }) => {
    await test.step('Show modal and accept consent', async () => {
      const modal = page.getByTestId('cookie-consent-modal');
      await expect(modal).toBeVisible();

      await page.getByTestId('cookie-consent-accept').click();
      await expect(modal).not.toBeVisible();
    });

    await test.step('Reload and verify modal is still dismissed', async () => {
      await page.reload();
      await expect(page.getByTestId('cookie-consent-modal')).not.toBeVisible();
    });
  });

  test('settings toggle enables and disables advertising consent', async ({ page }) => {
    await test.step('Accept consent from modal', async () => {
      await page.getByTestId('cookie-consent-accept').click();
      await expect(page.getByTestId('cookie-consent-modal')).not.toBeVisible();
    });

    await test.step('Open settings and validate initial accepted state', async () => {
      const settingsTab = page.getByText(Strings.pt.navigation.settings);
      await settingsTab.click();
      await expect(page).toHaveURL(/\/settings/);

      await expect(page.getByTestId('privacy-section')).toBeVisible();
      await expect(page.getByTestId('cookie-toggle-status')).toContainText(
        Strings.pt.settings.cookies.status.accepted
      );
    });

    await test.step('Disable advertising with toggle', async () => {
      await page.getByTestId('cookie-advertising-toggle').click();
      await expect(page.getByTestId('cookie-toggle-status')).toContainText(
        Strings.pt.settings.cookies.status.rejected
      );
      const raw = await page.evaluate(() => window.localStorage.getItem('dose_segura_cookie_consent_v1'));
      expect(raw).toContain('"status":"rejected"');
    });

    await test.step('Enable advertising again with toggle', async () => {
      await page.getByTestId('cookie-advertising-toggle').click();
      await expect(page.getByTestId('cookie-toggle-status')).toContainText(
        Strings.pt.settings.cookies.status.accepted
      );
      const raw = await page.evaluate(() => window.localStorage.getItem('dose_segura_cookie_consent_v1'));
      expect(raw).toContain('"status":"accepted"');
    });
  });
});
