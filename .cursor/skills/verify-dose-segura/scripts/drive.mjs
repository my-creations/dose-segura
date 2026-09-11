#!/usr/bin/env node
/**
 * Drive one mapped feature against the Launch instance and write evidence.
 *
 * Usage (from repo root):
 *   node .cursor/skills/verify-dose-segura/scripts/drive.mjs calculations
 *   node .cursor/skills/verify-dose-segura/scripts/drive.mjs medications-catalog
 *   node .cursor/skills/verify-dose-segura/scripts/drive.mjs procedures
 *   node .cursor/skills/verify-dose-segura/scripts/drive.mjs favorites
 *   node .cursor/skills/verify-dose-segura/scripts/drive.mjs settings
 *
 * Requires: launch.sh + doctor.sh already green. Uses Playwright from node_modules.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = path.resolve(__dirname, '..');
const RUN_DIR = process.env.VERIFY_RUN_DIR || path.join(SKILL_DIR, '.run');
const STATE_FILE = path.join(RUN_DIR, 'state.env');

function loadState() {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`Missing ${STATE_FILE}. Run scripts/launch.sh first.`);
  }
  const out = {};
  for (const line of fs.readFileSync(STATE_FILE, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function ariaDump(page) {
  const snapshot = await page.locator('body').ariaSnapshot();
  return typeof snapshot === 'string' ? snapshot : String(snapshot);
}

async function proof(page, evidenceDir, label) {
  ensureDir(evidenceDir);
  const shot = path.join(evidenceDir, `${label}.png`);
  const aria = path.join(evidenceDir, `${label}.aria.txt`);
  await page.screenshot({ path: shot, fullPage: true });
  fs.writeFileSync(aria, await ariaDump(page), 'utf8');
  const meta = {
    label,
    url: page.url(),
    capturedAt: new Date().toISOString(),
    title: await page.title(),
  };
  fs.writeFileSync(path.join(evidenceDir, `${label}.meta.json`), JSON.stringify(meta, null, 2));
  console.log(`Evidence: ${shot}`);
  console.log(`Evidence: ${aria}`);
}

const Strings = {
  medications: 'Medicamentos',
  favorites: 'Favoritos',
  calculations: 'Cálculos',
  procedures: 'Procedimentos',
  settings: 'Definições',
};

async function driveCalculations(page, evidenceDir) {
  await page.goto('/');
  await page.getByRole('tab', { name: new RegExp(Strings.calculations, 'i') }).click();
  await page.getByTestId('calculations-screen').waitFor({ state: 'visible' });
  await proof(page, evidenceDir, '01-open');

  await page.getByTestId('calculation-input-dose-ref').fill('100');
  await page.getByTestId('calculation-input-weight-ref').fill('70');
  await page.getByTestId('calculation-input-patient-weight').fill('7.5');

  const result = page.getByTestId('calculation-result');
  await result.waitFor({ state: 'visible' });
  const value = await page.getByTestId('calculation-result-value').innerText();
  if (!value.includes('10,7143') && !value.includes('10.7143')) {
    throw new Error(`Unexpected dose result: ${value}`);
  }
  await proof(page, evidenceDir, '02-dose-by-weight');

  await page.getByTestId('calculation-mode-volume').click();
  await page.getByTestId('calculation-input-prescribed-dose').fill('15');
  await page.getByTestId('calculation-input-concentration').fill('5');
  await page.getByTestId('calculation-result-value').waitFor({ state: 'visible' });
  const vol = await page.getByTestId('calculation-result-value').innerText();
  if (vol.trim() !== '3') throw new Error(`Unexpected volume result: ${vol}`);
  await proof(page, evidenceDir, '03-volume');
}

async function driveMedicationsCatalog(page, evidenceDir) {
  await page.goto('/');
  await page.getByTestId('home-screen').waitFor({ state: 'visible' });
  await proof(page, evidenceDir, '01-home');

  const search = page.getByTestId('search-input');
  await search.fill('Bicarb');
  const card = page.getByTestId('medication-card-bicarbonato-de-sodio');
  await card.waitFor({ state: 'visible' });
  await proof(page, evidenceDir, '02-search');

  await card.click();
  await page.getByTestId('medication-detail').waitFor({ state: 'visible' });
  await page.getByTestId('medication-title').waitFor({ state: 'visible' });
  await proof(page, evidenceDir, '03-detail');
}

async function driveProcedures(page, evidenceDir) {
  await page.goto('/');
  await page.getByRole('tab', { name: new RegExp(Strings.procedures, 'i') }).click();
  await page.getByTestId('procedures-screen').waitFor({ state: 'visible' });
  await page.getByText('Cateterismo venoso periférico').waitFor({ state: 'visible' });
  await proof(page, evidenceDir, '01-list');

  await page.getByText('Cateterismo venoso periférico').click();
  await page.getByTestId('procedure-detail').waitFor({ state: 'visible' });
  await proof(page, evidenceDir, '02-detail');
}

async function driveFavorites(page, evidenceDir) {
  await page.goto('/');
  await page.getByTestId('search-input').fill('Bicarb');
  const card = page.getByTestId('home-screen').getByTestId('medication-card-bicarbonato-de-sodio');
  await card.waitFor({ state: 'visible' });
  await card.getByTestId('favorite-button').click();
  await proof(page, evidenceDir, '01-favorited-on-home');

  await page.getByRole('tab', { name: new RegExp(Strings.favorites, 'i') }).click();
  await page.getByTestId('favorites-screen').waitFor({ state: 'visible' });
  await page
    .getByTestId('favorites-screen')
    .getByTestId('medication-card-bicarbonato-de-sodio')
    .waitFor({ state: 'visible' });
  await proof(page, evidenceDir, '02-favorites-list');

  await page
    .getByTestId('favorites-screen')
    .getByTestId('medication-card-bicarbonato-de-sodio')
    .getByTestId('favorite-button')
    .click();
  await proof(page, evidenceDir, '03-cleared');
}

async function driveSettings(page, evidenceDir) {
  await page.goto('/');
  await page.getByRole('tab', { name: new RegExp(Strings.settings, 'i') }).click();
  await page.getByTestId('settings-screen').waitFor({ state: 'visible' });
  await proof(page, evidenceDir, '01-settings');
}

const drivers = {
  calculations: driveCalculations,
  'medications-catalog': driveMedicationsCatalog,
  procedures: driveProcedures,
  favorites: driveFavorites,
  settings: driveSettings,
};

async function main() {
  const feature = process.argv[2];
  if (!feature || !drivers[feature]) {
    console.error(`Usage: drive.mjs <${Object.keys(drivers).join('|')}>`);
    process.exit(2);
  }

  const state = loadState();
  const baseURL = `http://${state.HOST || '127.0.0.1'}:${state.PORT}`;
  const evidenceDir = path.join(SKILL_DIR, 'evidence', feature);
  ensureDir(evidenceDir);

  // Clear prior proof for this feature so artifacts are from this run.
  for (const f of fs.readdirSync(evidenceDir)) {
    if (f === '.gitkeep') continue;
    fs.rmSync(path.join(evidenceDir, f), { recursive: true, force: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1280, height: 800 },
    locale: 'pt-PT',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);

  const runtimeErrors = [];
  page.on('pageerror', (e) => runtimeErrors.push(e.message));

  try {
    console.log(`Driving feature=${feature} at ${baseURL}`);
    await drivers[feature](page, evidenceDir);
    if (runtimeErrors.length) {
      throw new Error(`Page errors during drive: ${runtimeErrors.join(' | ')}`);
    }
    fs.writeFileSync(
      path.join(evidenceDir, 'PASS.json'),
      JSON.stringify({ feature, baseURL, passedAt: new Date().toISOString() }, null, 2),
    );
    console.log(`PASS ${feature}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
