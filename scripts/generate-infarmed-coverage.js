#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'data', 'meds.json');
const INFARMED_DIR = path.join(ROOT, 'infarmed');
const OUTPUT_PATH = path.join(INFARMED_DIR, 'coverage-matrix.json');

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

function main() {
  const data = readJson(DATA_PATH);
  const reviews = loadReviews();
  const rows = Object.values(data.medications).map((medication) => {
    const medicationDir = path.join(INFARMED_DIR, medication.id);
    const metaPath = path.join(medicationDir, 'meta.json');
    const meta = fs.existsSync(metaPath) ? readJson(metaPath) : null;
    const rcmFiles = listPdfFiles(path.join(medicationDir, 'rcm'));
    const fiFiles = listPdfFiles(path.join(medicationDir, 'fi'));
    const invalidPdfFiles = [...rcmFiles, ...fiFiles].filter((file) => !isPdf(file));
    const review = reviews.get(medication.id) ?? null;
    const override = DOCUMENT_OVERRIDES[medication.id] ?? {};

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
      evidenceRetrievedAt: meta?.retrievedAt ?? null,
      reviewedAt: review?.reviewedAt ?? null,
      reviewArtifact: review?.reviewArtifact ?? null,
      reviewDecision: review?.decision ?? null,
      note: override.note ?? null,
    };
  });

  const documentStatusCounts = rows.reduce((result, row) => {
    result[row.documentStatus] = (result[row.documentStatus] ?? 0) + 1;
    return result;
  }, {});

  const matrix = {
    generatedAt: new Date().toISOString(),
    catalogLastUpdated: data.lastUpdated,
    catalogMedicationCount: rows.length,
    reviewedMedicationCount: rows.filter((row) => row.reviewedAt).length,
    invalidPdfCount: rows.reduce((count, row) => count + row.invalidPdfFiles.length, 0),
    documentStatusCounts,
    rows,
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(matrix, null, 2)}\n`);
  console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)} with ${rows.length} rows.`);
}

main();
