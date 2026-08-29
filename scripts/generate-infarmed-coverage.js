#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'meds.json');
const INFARMED_DIR = path.join(ROOT, 'infarmed');
const OUTPUT_PATH = path.join(INFARMED_DIR, 'coverage-matrix.json');

const FRESHNESS_POLICY = Object.freeze({
  catalogMaxAgeDays: 30,
  highRiskMaxAgeDays: 180,
  standardMaxAgeDays: 365,
});

const DOCUMENT_OVERRIDES = {
  calcitriol: {
    documentStatus: 'revoked-product',
    note: 'The stored Calcijex metadata marks the product as revoked on 2016-01-20.',
  },
  'metilprednisolona-acetato': {
    documentStatus: 'mismatched',
    note: 'Stored artifact 56266 is Metilprednisolona Hikma powder, not methylprednisolone acetate suspension.',
  },
  'prednisolona-hemi-succinato': {
    documentStatus: 'mismatched',
    note: 'Stored artifact 56266 is Metilprednisolona Hikma powder, not prednisolone hemisuccinate.',
  },
  risperidona: {
    documentStatus: 'mismatched',
    note: 'The 2026-08-11 search metadata identifies Okedi 100 mg/0.490 ml; the catalog entry describes Risperdal Consta 25/37.5/50 mg.',
  },
  'neostigmina-metilsulfato': {
    note: 'No current INFOMED result with documents was found on 2026-08-11.',
  },
  tenoxicam: {
    note: 'No current injectable INFOMED result with documents was found on 2026-08-11.',
  },
  tiocolchicosido: {
    note: 'No current INFOMED result with documents was found on 2026-08-11.',
  },
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function listPdfFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
    .map((entry) => path.relative(ROOT, path.join(directory, entry.name)))
    .sort();
}

function isPdf(file) {
  const descriptor = fs.openSync(path.join(ROOT, file), 'r');
  const header = Buffer.alloc(4);
  fs.readSync(descriptor, header, 0, 4, 0);
  fs.closeSync(descriptor);
  return header.toString('latin1') === '%PDF';
}

function loadReviews() {
  const reviews = new Map();
  const reviewFiles = fs
    .readdirSync(INFARMED_DIR)
    .filter((name) => /-gap-review-\d{4}-\d{2}-\d{2}\.json$/.test(name))
    .sort();

  for (const name of reviewFiles) {
    const review = readJson(path.join(INFARMED_DIR, name));
    const entries = review.entries ?? review.changes ?? [];
    for (const entry of entries) {
      reviews.set(entry.id, {
        reviewedAt: review.reviewedAt,
        reviewArtifact: `infarmed/${name}`,
        decision: entry.decision ?? 'reviewed',
      });
    }
  }

  return reviews;
}

function inferDocumentStatus(rcmFiles, fiFiles) {
  if (rcmFiles.length && fiFiles.length) return 'rcm-and-fi';
  if (rcmFiles.length) return 'rcm-only';
  if (fiFiles.length) return 'fi-only';
  return 'missing';
}

function parseAsOfDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid --as-of date ${JSON.stringify(value)}; expected YYYY-MM-DD.`);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(
      `Invalid --as-of date ${JSON.stringify(value)}; expected a real calendar date.`,
    );
  }

  return parsed;
}

function ageInDays(referenceDate, asOfDate) {
  const reference = new Date(referenceDate);
  if (Number.isNaN(reference.getTime())) {
    return null;
  }

  return Math.max(0, Math.floor((asOfDate.getTime() - reference.getTime()) / 86_400_000));
}

function evaluateFreshness(referenceDate, maxAgeDays, asOfDate) {
  if (!referenceDate) {
    return {
      freshnessStatus: 'unknown',
      freshnessReferenceDate: null,
      freshnessAgeDays: null,
      freshnessMaxAgeDays: maxAgeDays,
    };
  }

  const ageDays = ageInDays(referenceDate, asOfDate);
  if (ageDays === null) {
    return {
      freshnessStatus: 'unknown',
      freshnessReferenceDate: referenceDate,
      freshnessAgeDays: null,
      freshnessMaxAgeDays: maxAgeDays,
    };
  }

  return {
    freshnessStatus: ageDays > maxAgeDays ? 'stale' : 'current',
    freshnessReferenceDate: referenceDate,
    freshnessAgeDays: ageDays,
    freshnessMaxAgeDays: maxAgeDays,
  };
}

function evaluateMedicationFreshness({ reviewedAt, evidenceRetrievedAt, maxAgeDays, asOfDate }) {
  return {
    ...evaluateFreshness(reviewedAt ?? evidenceRetrievedAt, maxAgeDays, asOfDate),
    evidenceFreshness: evaluateFreshness(evidenceRetrievedAt, maxAgeDays, asOfDate),
  };
}

function getAsOfDate(argv = process.argv.slice(2), now = new Date()) {
  const asOfIndex = argv.indexOf('--as-of');
  if (asOfIndex === -1) {
    return now.toISOString().slice(0, 10);
  }

  const value = argv[asOfIndex + 1];
  if (!value) {
    throw new Error('--as-of requires a YYYY-MM-DD value.');
  }

  parseAsOfDate(value);
  return value;
}

function buildCoverageMatrix({ asOfDate }) {
  const data = readJson(DATA_PATH);
  const reviews = loadReviews();
  const asOf = parseAsOfDate(asOfDate);
  const rows = Object.values(data.medications).map((medication) => {
    const medicationDir = path.join(INFARMED_DIR, medication.id);
    const metaPath = path.join(medicationDir, 'meta.json');
    const meta = fs.existsSync(metaPath) ? readJson(metaPath) : null;
    const rcmFiles = listPdfFiles(path.join(medicationDir, 'rcm'));
    const fiFiles = listPdfFiles(path.join(medicationDir, 'fi'));
    const invalidPdfFiles = [...rcmFiles, ...fiFiles].filter((file) => !isPdf(file));
    const review = reviews.get(medication.id) ?? null;
    const override = DOCUMENT_OVERRIDES[medication.id] ?? {};
    const evidenceRetrievedAt = meta?.retrievedAt ?? null;
    const reviewedAt = review?.reviewedAt ?? null;
    const maxAgeDays = medication.highRisk
      ? FRESHNESS_POLICY.highRiskMaxAgeDays
      : FRESHNESS_POLICY.standardMaxAgeDays;

    return {
      id: medication.id,
      name: medication.name,
      highRisk: medication.highRisk,
      catalogLastUpdated: data.lastUpdated,
      documentStatus: override.documentStatus ?? inferDocumentStatus(rcmFiles, fiFiles),
      rcmFiles,
      fiFiles,
      invalidPdfFiles,
      infarmedMatch: meta?.bestMatch
        ? {
            infarmedId: meta.bestMatch.infarmedId ?? null,
            name: meta.bestMatch.name ?? null,
            dci: meta.bestMatch.dci ?? null,
            form: meta.bestMatch.form ?? null,
            dosage: meta.bestMatch.dosage ?? null,
          }
        : null,
      evidenceRetrievedAt,
      reviewedAt,
      reviewArtifact: review?.reviewArtifact ?? null,
      reviewDecision: review?.decision ?? null,
      note: override.note ?? null,
      ...evaluateMedicationFreshness({
        reviewedAt,
        evidenceRetrievedAt,
        maxAgeDays,
        asOfDate: asOf,
      }),
    };
  });

  const documentStatusCounts = rows.reduce((result, row) => {
    result[row.documentStatus] = (result[row.documentStatus] ?? 0) + 1;
    return result;
  }, {});

  const freshnessStatusCounts = rows.reduce((result, row) => {
    result[row.freshnessStatus] = (result[row.freshnessStatus] ?? 0) + 1;
    return result;
  }, {});
  const catalogFreshness = evaluateFreshness(
    data.lastUpdated,
    FRESHNESS_POLICY.catalogMaxAgeDays,
    asOf,
  );

  return {
    generatedAt: `${asOfDate}T00:00:00.000Z`,
    freshnessAsOfDate: asOfDate,
    freshnessPolicy: FRESHNESS_POLICY,
    catalogLastUpdated: data.lastUpdated,
    catalogFreshness,
    catalogMedicationCount: rows.length,
    reviewedMedicationCount: rows.filter((row) => row.reviewedAt).length,
    invalidPdfCount: rows.reduce((count, row) => count + row.invalidPdfFiles.length, 0),
    documentStatusCounts,
    freshnessStatusCounts,
    staleHighRiskMedicationCount: rows.filter(
      (row) => row.highRisk && row.freshnessStatus === 'stale',
    ).length,
    unknownHighRiskMedicationCount: rows.filter(
      (row) => row.highRisk && row.freshnessStatus === 'unknown',
    ).length,
    rows,
  };
}

function main() {
  const asOfDate = getAsOfDate();
  const matrix = buildCoverageMatrix({ asOfDate });

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(matrix, null, 2)}\n`);
  console.log(
    `Generated ${path.relative(ROOT, OUTPUT_PATH)} with ${matrix.catalogMedicationCount} rows ` +
      `(${matrix.staleHighRiskMedicationCount} stale high-risk, ` +
      `${matrix.unknownHighRiskMedicationCount} unknown high-risk).`,
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  FRESHNESS_POLICY,
  ageInDays,
  evaluateFreshness,
  evaluateMedicationFreshness,
  getAsOfDate,
  buildCoverageMatrix,
};
