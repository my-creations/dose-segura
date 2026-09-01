#!/usr/bin/env node
/**
 * Sort `medications` keys in data/meds.json (natural, ascending).
 * Replaces eslint-plugin-jsonc `jsonc/sort-keys`.
 *
 * Usage:
 *   node scripts/sort-meds-json.js            # same as --check
 *   node scripts/sort-meds-json.js --check
 *   node scripts/sort-meds-json.js --fix
 *   node scripts/sort-meds-json.js --check path/to/meds.json
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_MEDS_PATH = path.join(__dirname, '..', 'data', 'meds.json');

function compareMedicationKeys(left, right) {
  return String(left).localeCompare(String(right), 'en', {
    numeric: true,
    sensitivity: 'variant',
  });
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sortMedicationsMap(medications) {
  const sorted = {};
  for (const key of Object.keys(medications).sort(compareMedicationKeys)) {
    sorted[key] = medications[key];
  }
  return sorted;
}

function sortMedsDocument(document) {
  if (!isObject(document) || !isObject(document.medications)) {
    throw new Error('data/meds.json: medications must be an object map');
  }
  return {
    ...document,
    medications: sortMedicationsMap(document.medications),
  };
}

function serializeMedsJson(document) {
  return `${JSON.stringify(document, null, 2)}\n`;
}

function getUnsortedKeys(medications) {
  const keys = Object.keys(medications);
  const sorted = [...keys].sort(compareMedicationKeys);
  const unsorted = [];
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i] !== sorted[i]) {
      unsorted.push({ actual: keys[i], expected: sorted[i], index: i });
    }
  }
  return { keys, sorted, unsorted };
}

function checkMedsSource(source, label = 'data/meds.json') {
  let document;
  try {
    document = JSON.parse(source);
  } catch (error) {
    throw new Error(
      `${label}: invalid JSON (${error instanceof Error ? error.message : String(error)})`,
    );
  }
  if (!isObject(document) || !isObject(document.medications)) {
    throw new Error(`${label}: medications must be an object map`);
  }
  const { unsorted, sorted } = getUnsortedKeys(document.medications);
  return {
    document,
    ok: unsorted.length === 0,
    unsorted,
    sortedKeys: sorted,
  };
}

function formatCheckError(result, label = 'data/meds.json') {
  const first = result.unsorted[0];
  return (
    `${label}: medications keys are not sorted naturally/ascending.\n` +
    `- first mismatch at index ${first.index}: "${first.actual}" should be "${first.expected}"\n` +
    `Run: bun run lint:meds:fix`
  );
}

function relativeLabel(filePath) {
  const relative = path.relative(process.cwd(), filePath);
  return relative || filePath;
}

function readMedsFile(filePath = DEFAULT_MEDS_PATH) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeMedsFile(contents, filePath = DEFAULT_MEDS_PATH) {
  fs.writeFileSync(filePath, contents, 'utf8');
}

function check(filePath = DEFAULT_MEDS_PATH) {
  const label = relativeLabel(filePath);
  const result = checkMedsSource(readMedsFile(filePath), label);
  if (!result.ok) {
    const error = new Error(formatCheckError(result, label));
    error.name = 'MedicationKeySortError';
    throw error;
  }
  return result;
}

function fix(filePath = DEFAULT_MEDS_PATH) {
  const label = relativeLabel(filePath);
  const result = checkMedsSource(readMedsFile(filePath), label);
  if (result.ok) return { changed: false, document: result.document };
  const sorted = sortMedsDocument(result.document);
  writeMedsFile(serializeMedsJson(sorted), filePath);
  return { changed: true, document: sorted };
}

const defaultLogger = {
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
};

/**
 * @param {string[]} [argv]
 * @param {{ log: (...args: unknown[]) => void, error: (...args: unknown[]) => void }} [io]
 */
function main(argv = process.argv.slice(2), io = defaultLogger) {
  const command = argv.includes('--fix') ? 'fix' : 'check';
  const fileArg = argv.find((arg) => arg !== '--fix' && arg !== '--check');
  const filePath = fileArg ? path.resolve(fileArg) : DEFAULT_MEDS_PATH;
  try {
    if (command === 'fix') {
      const outcome = fix(filePath);
      io.log(
        outcome.changed
          ? `Sorted medications keys in ${relativeLabel(filePath)}`
          : `medications keys already sorted in ${relativeLabel(filePath)}`,
      );
      return 0;
    }
    check(filePath);
    io.log(`medications keys are sorted (${relativeLabel(filePath)})`);
    return 0;
  } catch (error) {
    io.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

module.exports = {
  compareMedicationKeys,
  sortMedicationsMap,
  sortMedsDocument,
  serializeMedsJson,
  checkMedsSource,
  check,
  fix,
  main,
  DEFAULT_MEDS_PATH,
};

if (require.main === module) {
  process.exit(main());
}
