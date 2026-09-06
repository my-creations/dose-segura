import { expect, test } from '@playwright/test';

import { Strings } from '../../constants/Strings';

test.describe('Pediatric calculations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('tab', { name: new RegExp(Strings.pt.navigation.calculations, 'i') })
      .click();
    await expect(page.getByTestId('calculations-screen')).toBeVisible();
  });

  test('computes dose by weight with a visible formula and disclaimer', async ({ page }) => {
    await page.getByTestId('calculation-input-dose-ref').fill('100');
    await page.getByTestId('calculation-input-weight-ref').fill('70');
    await page.getByTestId('calculation-input-patient-weight').fill('7.5');

    const result = page.getByTestId('calculation-result');
    await expect(result).toBeVisible();
    await expect(page.getByTestId('calculation-result-value')).toContainText('10,7143');
    await expect(page.getByTestId('calculation-result-unit')).toHaveText('mg');
    await expect(page.getByTestId('calculation-result-formula')).toContainText(
      '100 mg × 7,5 kg ÷ 70 kg = 10,7143 mg',
    );
    await expect(page.getByTestId('calculation-disclaimer')).toContainText(
      Strings.pt.calculations.disclaimer,
    );
  });

  test('computes volume to draw from chips, not a keypad', async ({ page }) => {
    await page.getByTestId('calculation-mode-volume').click();
    await page.getByTestId('calculation-input-prescribed-dose').fill('15');
    await page.getByTestId('calculation-input-concentration').fill('5');

    await expect(page.getByTestId('calculation-result-value')).toHaveText('3');
    await expect(page.getByTestId('calculation-result-unit')).toHaveText('mL');
    await expect(page.getByTestId('calculation-result-formula')).toHaveText(
      '15 mg ÷ 5 mg/mL = 3 mL',
    );
  });

  test('does not show a result for empty or zero inputs', async ({ page }) => {
    await expect(page.getByTestId('calculation-result')).toHaveCount(0);

    await page.getByTestId('calculation-input-dose-ref').fill('100');
    await page.getByTestId('calculation-input-weight-ref').fill('0');
    await page.getByTestId('calculation-input-patient-weight').fill('7');

    await expect(page.getByTestId('calculation-result')).toHaveCount(0);
    await expect(page.getByTestId('calculation-error')).toContainText(
      Strings.pt.calculations.errors.zeroOrNegative,
    );
  });
});
