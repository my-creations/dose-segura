import { expect, test } from '@playwright/test';

import { Strings } from '../../constants/Strings';

test.describe('Nursing procedures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens the procedimentos tab with seeded catalog templates as user procedures', async ({
    page,
  }) => {
    const proceduresTab = page.getByRole('tab', {
      name: new RegExp(Strings.pt.navigation.procedures, 'i'),
    });

    await expect(proceduresTab).toBeVisible();
    await proceduresTab.click();
    await expect(page).toHaveURL(/\/procedures$/);
    await expect(page.getByTestId('procedures-screen')).toBeVisible();
    await expect(page.getByText('Cateterismo venoso periférico')).toBeVisible();
    await expect(page.getByText('Sondagem nasogástrica')).toBeVisible();
    await expect(page.getByText(Strings.pt.procedures.userBadge).first()).toBeVisible();

    await page.getByText('Cateterismo venoso periférico').click();
    await expect(page.getByTestId('procedure-detail')).toBeVisible();
    await expect(page.getByTestId('procedure-title')).toHaveText('Cateterismo venoso periférico');
    await expect(page.getByText(Strings.pt.procedures.disclaimer)).toBeVisible();
    await expect(page.getByTestId('procedure-materials')).toContainText('Luvas');
    await expect(page.getByTestId('procedure-steps')).toContainText('Identificar o doente');
    await expect(page.getByTestId('procedure-attention')).toContainText('flebite');
    await expect(page.getByTestId('procedure-edit')).toBeVisible();
    await expect(page.getByTestId('procedure-delete')).toBeVisible();
  });

  test('adds from catalog after delete and creates a user procedure from the FAB menu', async ({
    page,
  }) => {
    await page
      .getByRole('tab', { name: new RegExp(Strings.pt.navigation.procedures, 'i') })
      .click();
    await expect(page.getByTestId('procedures-screen')).toBeVisible();

    await page.getByText('Cateterismo venoso periférico').click();
    await expect(page.getByTestId('procedure-detail')).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByTestId('procedure-delete').click();
    await expect(page.getByTestId('procedures-screen')).toBeVisible();
    await expect(page.getByText('Cateterismo venoso periférico')).toHaveCount(0);

    await page.getByTestId('procedures-new-button').click();
    await expect(page.getByTestId('procedures-add-menu')).toBeVisible();
    await page.getByTestId('procedures-add-from-catalog').click();
    await expect(page.getByTestId('procedure-catalog-screen')).toBeVisible();

    await expect(
      page.getByTestId('catalog-add-builtin-cateterismo-venoso-periferico'),
    ).toBeVisible();
    await expect(
      page.getByTestId('catalog-already-added-builtin-sondagem-nasogastrica'),
    ).toBeVisible();

    await page.getByTestId('catalog-add-builtin-cateterismo-venoso-periferico').click();
    await expect(page.getByTestId('procedure-detail')).toBeVisible();
    await expect(page.getByTestId('procedure-title')).toHaveText('Cateterismo venoso periférico');
    await expect(page.getByTestId('procedure-user-badge')).toBeVisible();
    await expect(page.getByTestId('procedure-edit')).toBeVisible();

    await page.goto('/procedures');
    await expect(page.getByTestId('procedures-screen')).toBeVisible();
    await page.getByTestId('procedures-new-button').click();
    await page.getByTestId('procedures-create-new').click();
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
