import { expect, test } from '@playwright/test';

import { MEDICATION_SECTIONS } from '../../catalog/medicationSections';
import medsData from '../../data/meds.json';
import type { Medication } from '../../types/medication';

const medications = Object.values(medsData.medications) as Medication[];
const BATCH_SIZE = 30;
const batches = Array.from({ length: Math.ceil(medications.length / BATCH_SIZE) }, (_, index) =>
  medications.slice(index * BATCH_SIZE, (index + 1) * BATCH_SIZE),
);

test.describe('Medication Catalog rendering', () => {
  test.beforeEach((_fixtures, testInfo) => {
    test.skip(
      testInfo.project.name !== 'Desktop Chrome',
      'The exhaustive catalog contract runs once on Desktop Chrome',
    );
  });

  for (const [batchIndex, batch] of batches.entries()) {
    test(`renders every Medication Detail from canonical data (batch ${batchIndex + 1}/${batches.length})`, async ({
      page,
    }) => {
      test.setTimeout(240_000);
      const runtimeErrors: string[] = [];
      page.on('pageerror', (error) => runtimeErrors.push(error.message));
      page.on('console', (message) => {
        if (message.type() === 'error') runtimeErrors.push(message.text());
      });

      for (const medication of batch) {
        await test.step(medication.id, async () => {
          const errorsBeforeNavigation = runtimeErrors.length;
          await page.goto(`/medication/${medication.id}`);

          await expect(page).toHaveURL(new RegExp(`/medication/${medication.id}$`));
          await expect(page.getByTestId('medication-detail')).toBeVisible();
          await expect(page.getByTestId('medication-title')).toHaveText(medication.name);

          const aliases = page.getByTestId('medication-aliases');
          if (medication.aliases.length === 0) {
            await expect(aliases).toHaveCount(0);
          } else {
            await expect(aliases).toBeVisible();
            for (const [index, alias] of medication.aliases.entries()) {
              await expect(page.getByTestId(`medication-alias-${index}`)).toHaveText(alias);
            }
          }

          const highRiskBadge = page.getByTestId('high-risk-badge');
          await expect(highRiskBadge).toHaveCount(medication.highRisk ? 1 : 0);
          if (medication.highRisk) await expect(highRiskBadge).toBeVisible();

          let renderedSectionCount = 0;
          for (const sectionKey of MEDICATION_SECTIONS) {
            const expectedItems = medication[sectionKey];
            const section = page.getByTestId(`section-${sectionKey}`);

            if (expectedItems.length === 0) {
              await expect(section).toHaveCount(0);
              continue;
            }

            renderedSectionCount += 1;
            await expect(section).toBeVisible();
            for (const [index, item] of expectedItems.entries()) {
              await expect(page.getByTestId(`section-${sectionKey}-item-${index}`)).toHaveText(
                item,
              );
            }
          }

          await expect(page.getByTestId('medication-section-tile')).toHaveCount(
            renderedSectionCount,
          );
          await expect(page.getByTestId('medication-disclaimer')).toBeVisible();
          expect(runtimeErrors.slice(errorsBeforeNavigation), medication.id).toEqual([]);
        });
      }
    });
  }
});
