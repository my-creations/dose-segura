import { expect, test } from '@playwright/test';

import { Strings } from '../../constants/Strings';

test.describe('Nursing procedures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens the procedimentos tab and a built-in starter', async ({ page }) => {
    const proceduresTab = page.getByRole('tab', {
      name: new RegExp(Strings.pt.navigation.procedures, 'i'),
    });

    await expect(proceduresTab).toBeVisible();
    await proceduresTab.click();
    await expect(page).toHaveURL(/\/procedures$/);
    await expect(page.getByTestId('procedures-screen')).toBeVisible();
    await expect(page.getByText('Cateterismo venoso periférico')).toBeVisible();
    await expect(page.getByText('Sondagem nasogástrica')).toBeVisible();

    await page.getByTestId('procedure-card-builtin-cateterismo-venoso-periferico').click();
    await expect(page.getByTestId('procedure-detail')).toBeVisible();
    await expect(page.getByTestId('procedure-title')).toHaveText('Cateterismo venoso periférico');
    await expect(page.getByText(Strings.pt.procedures.disclaimer)).toBeVisible();
    await expect(page.getByTestId('procedure-materials')).toContainText('Luvas');
    await expect(page.getByTestId('procedure-steps')).toContainText('Identificar o doente');
    await expect(page.getByTestId('procedure-attention')).toContainText('flebite');
    await expect(page.getByTestId('procedure-duplicate')).toBeVisible();
    await expect(page.getByTestId('procedure-edit')).toHaveCount(0);
  });

  test('duplicates a built-in starter into an editable copy and creates a user procedure', async ({
    page,
  }) => {
    await page
      .getByRole('tab', { name: new RegExp(Strings.pt.navigation.procedures, 'i') })
      .click();
    await page.getByTestId('procedure-card-builtin-cateterismo-venoso-periferico').click();
    await page.getByTestId('procedure-duplicate').click();

    await expect(page).toHaveURL(/\/procedure\/user-/);
    await expect(page.getByTestId('procedure-detail')).toBeVisible();
    await expect(page.getByTestId('procedure-title')).toHaveText(
      'Cateterismo venoso periférico (cópia)',
    );
    await expect(page.getByTestId('procedure-edit')).toBeVisible();

    await page.goto('/procedures');
    await expect(page.getByTestId('procedures-screen')).toBeVisible();
    await page.getByTestId('procedures-new-button').click();
    await expect(page.getByTestId('procedure-form')).toBeVisible();

    await page.getByTestId('procedure-form-title').fill('Lista de verificação de teste');
    await page.getByTestId('procedure-form-materials-item-0').fill('Luvas');
    await page.getByTestId('procedure-form-steps-item-0').fill('Identificar o doente');
    await page.getByTestId('procedure-form-attention-item-0').fill('Validar com o protocolo');
    await page.getByTestId('procedure-form-save').click();

    await expect(page.getByTestId('procedure-detail')).toBeVisible();
    await expect(page.getByTestId('procedure-title')).toHaveText('Lista de verificação de teste');
    await expect(page.getByTestId('procedure-user-badge')).toBeVisible();
  });
});
