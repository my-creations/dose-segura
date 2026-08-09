#!/usr/bin/env node
/**
 * Medication Artifact Module.
 *
 * data/meds.json is the only authored Medication source. This module owns
 * validation and deterministic generation of the eager index and lazy web data.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
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
const ROOT_KEYS = ['version', 'lastUpdated', 'medications'];

const ARTIFACTS = [
  { name: 'index', relativePath: 'data/meds-index.json' },
  { name: 'webFull', relativePath: 'public/meds-full.json' },
];

class MedicationArtifactError extends Error {
  /** @param {string[]} issues */
  constructor(issues) {
    const suffix = issues.some((issue) => /is (missing|stale)$/.test(issue))
      ? '\nRun: npm run generate:meds'
      : '';
    super(
      `Medication artifact validation failed:\n${issues.map((issue) => `- ${issue}`).join('\n')}${suffix}`,
    );
    this.name = 'MedicationArtifactError';
    this.issues = issues;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isTrimmedStringArray(value, allowEmpty = true) {
  return (
    Array.isArray(value) &&
    (allowEmpty || value.length > 0) &&
    value.every((item) => typeof item === 'string' && item.trim().length > 0)
  );
}

function compareIds(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/** @param {unknown} canonical */
function validateCanonical(canonical) {
  const issues = [];
  if (!isObject(canonical)) return ['data/meds.json: root must be an object'];

  const root = canonical;
  for (const key of ROOT_KEYS) {
    if (!(key in root)) issues.push(`data/meds.json: missing required key "${key}"`);
  }
  for (const key of Object.keys(root)) {
    if (!ROOT_KEYS.includes(key)) issues.push(`data/meds.json: unexpected key "${key}"`);
  }

  if (!isNonEmptyString(root.version) || !VERSION_RE.test(root.version)) {
    issues.push(`data/meds.json: version must match x.y.z (got ${JSON.stringify(root.version)})`);
  }
  if (!isNonEmptyString(root.lastUpdated) || !DATE_RE.test(root.lastUpdated)) {
    issues.push(
      `data/meds.json: lastUpdated must be YYYY-MM-DD (got ${JSON.stringify(root.lastUpdated)})`,
    );
  }
  if (!isObject(root.medications)) {
    issues.push('data/meds.json: medications must be an object map');
    return issues;
  }

  const ids = Object.keys(root.medications);
  if (ids.length === 0) issues.push('data/meds.json: medications map is empty');

  for (const id of ids) {
    const medication = root.medications[id];
    const prefix = `data/meds.json.medications[${id}]`;
    if (!isObject(medication)) {
      issues.push(`${prefix}: must be an object`);
      continue;
    }

    for (const key of FULL_KEYS) {
      if (!(key in medication)) issues.push(`${prefix}: missing required key "${key}"`);
    }
    for (const key of Object.keys(medication)) {
      if (!FULL_KEYS.includes(key)) issues.push(`${prefix}: unexpected key "${key}"`);
    }

    if (medication.id !== id) {
      issues.push(`${prefix}: id must equal map key (got ${JSON.stringify(medication.id)})`);
    }
    if (!isNonEmptyString(medication.name)) {
      issues.push(`${prefix}: name must be a non-empty string`);
    }
    if (typeof medication.highRisk !== 'boolean') {
      issues.push(`${prefix}: highRisk must be a boolean`);
    }
    if (!isTrimmedStringArray(medication.aliases)) {
      issues.push(`${prefix}: aliases must be an array of non-empty strings`);
    }
    if (!isTrimmedStringArray(medication.classification, false)) {
      issues.push(`${prefix}: classification must be a non-empty array of non-empty strings`);
    }
    for (const key of DETAIL_KEYS) {
      if (key in medication && !isTrimmedStringArray(medication[key])) {
        issues.push(`${prefix}.${key}: must be an array of non-empty strings`);
      }
    }
  }

  return issues;
}

function pick(object, keys) {
  return Object.fromEntries(keys.map((key) => [key, object[key]]));
}

/** @param {Record<string, any>} canonical */
function compileArtifacts(canonical) {
  const issues = validateCanonical(canonical);
  if (issues.length > 0) throw new MedicationArtifactError(issues);

  const ids = Object.keys(canonical.medications).sort(compareIds);
  const fullMedications = {};
  const summaries = {};

  for (const id of ids) {
    const medication = canonical.medications[id];
    fullMedications[id] = pick(medication, FULL_KEYS);
    summaries[id] = pick(medication, SUMMARY_KEYS);
  }

  const metadata = {
    version: canonical.version,
    lastUpdated: canonical.lastUpdated,
  };
  const webFull = { ...metadata, medications: fullMedications };
  const index = { ...metadata, medications: summaries };

  return {
    metadata,
    medicationCount: ids.length,
    contents: {
      index: `${JSON.stringify(index, null, 2)}\n`,
      webFull: `${JSON.stringify(webFull, null, 2)}\n`,
    },
  };
}

/**
 * @param {{
 *   readCanonical(): string,
 *   readArtifact(name: string): string | undefined,
 *   replaceArtifact(name: string, contents: string): void,
 * }} store
 */
function createMedicationArtifactModule(store) {
  function compile() {
    let canonical;
    try {
      canonical = JSON.parse(store.readCanonical());
    } catch (error) {
      throw new MedicationArtifactError([
        `data/meds.json: invalid JSON (${error instanceof Error ? error.message : String(error)})`,
      ]);
    }
    return compileArtifacts(canonical);
  }

  function report(compiled, artifacts) {
    return {
      medicationCount: compiled.medicationCount,
      version: compiled.metadata.version,
      lastUpdated: compiled.metadata.lastUpdated,
      artifacts,
    };
  }

  function check() {
    const compiled = compile();
    const issues = [];
    const statuses = [];

    for (const artifact of ARTIFACTS) {
      const current = store.readArtifact(artifact.name);
      const expected = compiled.contents[artifact.name];
      if (current === undefined) {
        issues.push(`${artifact.relativePath} is missing`);
        statuses.push({ name: artifact.name, status: 'missing' });
      } else if (current !== expected) {
        issues.push(`${artifact.relativePath} is stale`);
        statuses.push({ name: artifact.name, status: 'stale' });
      } else {
        statuses.push({ name: artifact.name, status: 'current' });
      }
    }

    if (issues.length > 0) throw new MedicationArtifactError(issues);
    return report(compiled, statuses);
  }

  function sync() {
    const compiled = compile();
    const statuses = [];

    // Derive and validate every output before the first write.
    for (const artifact of ARTIFACTS) {
      const expected = compiled.contents[artifact.name];
      const current = store.readArtifact(artifact.name);
      if (current === expected) {
        statuses.push({ name: artifact.name, status: 'current' });
        continue;
      }
      store.replaceArtifact(artifact.name, expected);
      statuses.push({ name: artifact.name, status: 'written' });
    }

    return report(compiled, statuses);
  }

  return { check, sync };
}

function createNodeMedicationArtifactStore(rootDir = ROOT) {
  const paths = {
    canonical: path.join(rootDir, 'data', 'meds.json'),
    index: path.join(rootDir, 'data', 'meds-index.json'),
    webFull: path.join(rootDir, 'public', 'meds-full.json'),
  };

  return {
    readCanonical() {
      return fs.readFileSync(paths.canonical, 'utf8');
    },
    readArtifact(name) {
      try {
        return fs.readFileSync(paths[name], 'utf8');
      } catch (error) {
        if (error && error.code === 'ENOENT') return undefined;
        throw error;
      }
    },
    replaceArtifact(name, contents) {
      const target = paths[name];
      fs.mkdirSync(path.dirname(target), { recursive: true });
      const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
      try {
        fs.writeFileSync(temporary, contents, 'utf8');
        fs.renameSync(temporary, target);
      } finally {
        if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
      }
    },
  };
}

const defaultModule = createMedicationArtifactModule(createNodeMedicationArtifactStore());

function checkMedicationArtifacts() {
  return defaultModule.check();
}

function syncMedicationArtifacts() {
  return defaultModule.sync();
}

function printReport(action, report) {
  console.log(
    `Medication artifacts ${action} (${report.medicationCount} medications, version ${report.version}, updated ${report.lastUpdated})`,
  );
  for (const artifact of report.artifacts) {
    console.log(`- ${artifact.name}: ${artifact.status}`);
  }
}

function main() {
  const command = process.argv[2] || 'check';
  try {
    if (command === 'check') {
      printReport('OK', checkMedicationArtifacts());
    } else if (command === 'sync' || command === 'generate' || command === 'write') {
      printReport('synchronized', syncMedicationArtifacts());
    } else {
      console.error('Usage: node scripts/medication-artifacts.js <check|sync>');
      process.exit(1);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

module.exports = {
  MedicationArtifactError,
  createMedicationArtifactModule,
  createNodeMedicationArtifactStore,
  checkMedicationArtifacts,
  syncMedicationArtifacts,
};

if (require.main === module) main();
