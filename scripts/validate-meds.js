#!/usr/bin/env node
/**
 * Validate medication catalog shape and index/full consistency.
 * Usage: node scripts/validate-meds.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MEDS_PATH = path.join(ROOT, 'data', 'meds.json');
const INDEX_PATH = path.join(ROOT, 'data', 'meds-index.json');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VERSION_RE = /^\d+\.\d+\.\d+$/;

const SUMMARY_KEYS = ['id', 'name', 'aliases', 'highRisk', 'classification'];
const DETAIL_KEYS = [
  'compatibility',
  'presentationAndStorage',
  'preparation',
  'administration',
  'stability',
  'contraindicationsAndPrecautions',
  'nursingCare',
];
const FULL_KEYS = [...SUMMARY_KEYS, ...DETAIL_KEYS];

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isTrimmedStringArray(value) {
  return isStringArray(value) && value.every((item) => item.trim().length > 0);
}

/**
 * @param {unknown} data
 * @param {'full' | 'index'} kind
 * @returns {string[]}
 */
function validateCatalogShape(data, kind) {
  const errors = [];
  const label = kind === 'full' ? 'meds.json' : 'meds-index.json';

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return [`${label}: root must be an object`];
  }

  const root = /** @type {Record<string, unknown>} */ (data);

  if (!isNonEmptyString(root.version) || !VERSION_RE.test(root.version)) {
    errors.push(`${label}: version must match x.y.z (got ${JSON.stringify(root.version)})`);
  }

  if (!isNonEmptyString(root.lastUpdated) || !DATE_RE.test(root.lastUpdated)) {
    errors.push(
      `${label}: lastUpdated must be YYYY-MM-DD (got ${JSON.stringify(root.lastUpdated)})`,
    );
  }

  if (!root.medications || typeof root.medications !== 'object' || Array.isArray(root.medications)) {
    errors.push(`${label}: medications must be an object map`);
    return errors;
  }

  const medications = /** @type {Record<string, unknown>} */ (root.medications);
  const ids = Object.keys(medications);
  if (ids.length === 0) {
    errors.push(`${label}: medications map is empty`);
  }

  const expectedKeys = kind === 'full' ? FULL_KEYS : SUMMARY_KEYS;

  for (const id of ids) {
    const entry = medications[id];
    const prefix = `${label}.medications[${id}]`;

    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${prefix}: must be an object`);
      continue;
    }

    const med = /** @type {Record<string, unknown>} */ (entry);
    const keys = Object.keys(med);

    for (const key of expectedKeys) {
      if (!(key in med)) {
        errors.push(`${prefix}: missing required key "${key}"`);
      }
    }

    for (const key of keys) {
      if (!expectedKeys.includes(key)) {
        errors.push(`${prefix}: unexpected key "${key}"`);
      }
    }

    if (med.id !== id) {
      errors.push(`${prefix}: id must equal map key (got ${JSON.stringify(med.id)})`);
    }

    if (!isNonEmptyString(med.name)) {
      errors.push(`${prefix}: name must be a non-empty string`);
    }

    if (typeof med.highRisk !== 'boolean') {
      errors.push(`${prefix}: highRisk must be a boolean`);
    }

    if (!isTrimmedStringArray(med.aliases)) {
      errors.push(`${prefix}: aliases must be an array of non-empty strings`);
    }

    if (!isTrimmedStringArray(med.classification)) {
      errors.push(`${prefix}: classification must be an array of non-empty strings`);
    }

    if (kind === 'full') {
      for (const key of DETAIL_KEYS) {
        if (!(key in med)) continue;
        if (!isStringArray(med[key])) {
          errors.push(`${prefix}.${key}: must be an array of strings`);
          continue;
        }
        const items = /** @type {string[]} */ (med[key]);
        items.forEach((item, index) => {
          if (!item.trim()) {
            errors.push(`${prefix}.${key}[${index}]: must not be empty/whitespace`);
          }
        });
      }
    }
  }

  return errors;
}

/**
 * @param {import('../types/medication').MedicationsData} full
 * @param {import('../types/medication').MedicationsIndexData} index
 * @returns {string[]}
 */
function validateIndexConsistency(full, index) {
  const errors = [];
  const fullIds = Object.keys(full.medications).sort();
  const indexIds = Object.keys(index.medications).sort();

  if (full.version !== index.version) {
    errors.push(
      `version mismatch: meds.json=${full.version} meds-index.json=${index.version}`,
    );
  }

  if (full.lastUpdated !== index.lastUpdated) {
    errors.push(
      `lastUpdated mismatch: meds.json=${full.lastUpdated} meds-index.json=${index.lastUpdated}`,
    );
  }

  const fullSet = new Set(fullIds);
  const indexSet = new Set(indexIds);

  for (const id of fullIds) {
    if (!indexSet.has(id)) {
      errors.push(`index missing medication id "${id}" present in meds.json`);
    }
  }

  for (const id of indexIds) {
    if (!fullSet.has(id)) {
      errors.push(`meds.json missing medication id "${id}" present in meds-index.json`);
    }
  }

  for (const id of fullIds) {
    if (!indexSet.has(id)) continue;
    const fullMed = full.medications[id];
    const indexMed = index.medications[id];

    for (const key of SUMMARY_KEYS) {
      const left = JSON.stringify(fullMed[key]);
      const right = JSON.stringify(indexMed[key]);
      if (left !== right) {
        errors.push(
          `summary field mismatch for "${id}.${key}": full=${left} index=${right}`,
        );
      }
    }
  }

  return errors;
}

/**
 * @param {{ fullPath?: string, indexPath?: string }} [options]
 * @returns {{ ok: boolean, errors: string[] }}
 */
function validateMedsFiles(options = {}) {
  const fullPath = options.fullPath || MEDS_PATH;
  const indexPath = options.indexPath || INDEX_PATH;
  const errors = [];

  let full;
  let index;

  try {
    full = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    errors.push(`failed to read/parse ${fullPath}: ${error.message}`);
  }

  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (error) {
    errors.push(`failed to read/parse ${indexPath}: ${error.message}`);
  }

  if (!full || !index) {
    return { ok: false, errors };
  }

  errors.push(...validateCatalogShape(full, 'full'));
  errors.push(...validateCatalogShape(index, 'index'));

  if (errors.length === 0) {
    errors.push(...validateIndexConsistency(full, index));
  }

  return { ok: errors.length === 0, errors };
}

function main() {
  const result = validateMedsFiles();
  if (!result.ok) {
    console.error(`Medication catalog validation failed (${result.errors.length} issue(s)):`);
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  const full = JSON.parse(fs.readFileSync(MEDS_PATH, 'utf8'));
  const count = Object.keys(full.medications).length;
  console.log(
    `Medication catalog OK (${count} medications, version ${full.version}, updated ${full.lastUpdated})`,
  );
}

module.exports = {
  validateMedsFiles,
  validateCatalogShape,
  validateIndexConsistency,
  SUMMARY_KEYS,
  DETAIL_KEYS,
  FULL_KEYS,
};

if (require.main === module) {
  main();
}
