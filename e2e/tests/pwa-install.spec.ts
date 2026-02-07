import { expect, test } from '@playwright/test';
import { Strings } from '../../constants/Strings';

test.describe('PWA Installation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows installation section in normal browser mode', async ({ page }) => {
    await test.step('Navigate to settings tab', async () => {
      const settingsTab = page.getByText(Strings.pt.navigation.settings);
      await expect(settingsTab).toBeVisible();
      await settingsTab.click();
      await expect(page).toHaveURL(/\/settings/);
    });

    await test.step('Verify installation section visibility', async () => {
      const section = page.getByTestId('installation-section');
      await expect(section).toBeVisible();
    });
    
    await test.step('Verify install button visibility and text', async () => {
      const installButton = page.getByTestId('install-button');
      await expect(installButton).toBeVisible();
      await expect(installButton).toContainText(Strings.pt.settings.install.button);
    });
  });

  test('clicking install button shows themed modal when prompt is not available', async ({ page }, testInfo) => {
    const isIosSafari = testInfo.project.use?.userAgent?.includes('iPhone');
    test.skip(!isIosSafari, 'Install instructions modal is iOS only');

    await test.step('Navigate to settings tab', async () => {
      const settingsTab = page.getByText(Strings.pt.navigation.settings);
      await expect(settingsTab).toBeVisible();
      await settingsTab.click();
      await expect(page).toHaveURL(/\/settings/);
    });

    await test.step('Click install button', async () => {
      const installButton = page.getByTestId('install-button');
      await expect(installButton).toBeVisible();
      await installButton.click();
    });

    await test.step('Verify modal visibility and content', async () => {
      const modal = page.getByTestId('pwa-install-modal');
      await expect(modal).toBeVisible();
      
      await expect(modal.getByText(Strings.pt.settings.install.iosTitle)).toBeVisible();

      const expectedDescription = Strings.pt.settings.install.iosInstructions.split('\n')[0];
      await expect(modal.getByTestId('pwa-install-description')).toContainText(expectedDescription);
    });
    
    await test.step('Close modal and verify it is hidden', async () => {
      const closeButton = page.getByTestId('accept-instructions-button');
      await closeButton.click();
      
      const modal = page.getByTestId('pwa-install-modal');
      await expect(modal).not.toBeVisible();
    });
  });
});

test.describe('PWA Standalone Mode', () => {
  // Emulate standalone mode
  test.use({ 
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  });

  test('hides installation section when already in standalone mode', async ({ page }) => {
    await test.step('Emulate standalone mode via script', async () => {
      await page.emulateMedia({ colorScheme: 'light' });
      
      await page.addInitScript(() => {
        const originalMatchMedia = window.matchMedia;
        window.matchMedia = (query) => {
          if (query.includes('standalone')) {
            return {
              matches: true,
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => false,
            } as any;
          }
          return originalMatchMedia(query);
        };
        
        Object.defineProperty(navigator, 'standalone', {
          get: () => true,
          configurable: true
        });
      });

      await page.goto('/');
    });

    await test.step('Navigate to settings tab', async () => {
      const settingsTab = page.getByText(Strings.pt.navigation.settings);
      await expect(settingsTab).toBeVisible();
      await settingsTab.click();
      await expect(page).toHaveURL(/\/settings/);
    });
    
    await test.step('Verify installation section is hidden', async () => {
      await expect(page.getByTestId('installation-section')).not.toBeVisible();
      await expect(page.getByTestId('install-button')).not.toBeVisible();
    });
  });
});
