import fs from 'fs';
import path from 'path';

const {
  FRESHNESS_POLICY,
  ageInDays,
  evaluateFreshness,
  evaluateMedicationFreshness,
  getAsOfDate,
  buildCoverageMatrix,
} = require('../../scripts/generate-infarmed-coverage');

const COVERAGE_MATRIX_PATH = path.join(__dirname, '../../infarmed/coverage-matrix.json');

describe('Infarmed coverage freshness', () => {
  const asOfDate = new Date('2026-08-14T00:00:00.000Z');

  it('uses stricter evidence freshness for high-risk medication', () => {
    expect(FRESHNESS_POLICY).toEqual({
      catalogMaxAgeDays: 30,
      highRiskMaxAgeDays: 180,
      standardMaxAgeDays: 365,
    });
  });

  it('calculates whole elapsed UTC days without returning negative ages', () => {
    expect(ageInDays('2026-02-08T00:00:00.000Z', asOfDate)).toBe(187);
    expect(ageInDays('2026-08-15T00:00:00.000Z', asOfDate)).toBe(0);
  });

  it('flags evidence older than the configured threshold as stale', () => {
    expect(evaluateFreshness('2026-02-08T00:00:00.000Z', 180, asOfDate)).toEqual({
      freshnessStatus: 'stale',
      freshnessReferenceDate: '2026-02-08T00:00:00.000Z',
      freshnessAgeDays: 187,
      freshnessMaxAgeDays: 180,
    });
  });

  it('keeps evidence at the threshold current', () => {
    expect(evaluateFreshness('2026-02-15', 180, asOfDate).freshnessStatus).toBe('current');
  });

  it('marks missing or invalid evidence dates as unknown', () => {
    expect(evaluateFreshness(null, 180, asOfDate).freshnessStatus).toBe('unknown');
    expect(evaluateFreshness('not-a-date', 180, asOfDate).freshnessStatus).toBe('unknown');
  });

  it('accepts an explicit audit date and rejects invalid values', () => {
    expect(getAsOfDate(['--as-of', '2026-08-14'])).toBe('2026-08-14');
    expect(() => getAsOfDate(['--as-of', '2026-02-30'])).toThrow('real calendar date');
    expect(() => getAsOfDate(['--as-of'])).toThrow('--as-of requires');
  });

  it('keeps process freshness current when a recent review covers older retrieved evidence', () => {
    const result = evaluateMedicationFreshness({
      reviewedAt: '2026-08-11T22:15:00.000+01:00',
      evidenceRetrievedAt: '2026-02-09T00:46:21.729Z',
      maxAgeDays: FRESHNESS_POLICY.highRiskMaxAgeDays,
      asOfDate,
    });

    expect(result.freshnessStatus).toBe('current');
    expect(result.freshnessReferenceDate).toBe('2026-08-11T22:15:00.000+01:00');
    expect(result.evidenceFreshness).toEqual({
      freshnessStatus: 'stale',
      freshnessReferenceDate: '2026-02-09T00:46:21.729Z',
      freshnessAgeDays: 185,
      freshnessMaxAgeDays: 180,
    });
  });

  it('falls back to retrieved evidence for process freshness when there is no review', () => {
    const result = evaluateMedicationFreshness({
      reviewedAt: null,
      evidenceRetrievedAt: '2026-02-08T00:00:00.000Z',
      maxAgeDays: FRESHNESS_POLICY.highRiskMaxAgeDays,
      asOfDate,
    });

    expect(result.freshnessStatus).toBe('stale');
    expect(result.freshnessReferenceDate).toBe('2026-02-08T00:00:00.000Z');
    expect(result.evidenceFreshness.freshnessStatus).toBe('stale');
    expect(result.evidenceFreshness.freshnessReferenceDate).toBe('2026-02-08T00:00:00.000Z');
  });

  it('keeps the committed coverage matrix in sync with the generator for its as-of date', () => {
    const committed = JSON.parse(fs.readFileSync(COVERAGE_MATRIX_PATH, 'utf8'));
    const generated = buildCoverageMatrix({ asOfDate: committed.freshnessAsOfDate });

    expect(generated.generatedAt).toBe(`${committed.freshnessAsOfDate}T00:00:00.000Z`);
    expect(generated.staleHighRiskMedicationCount).toBe(
      generated.rows.filter((row: { highRisk: boolean; freshnessStatus: string }) => {
        return row.highRisk && row.freshnessStatus === 'stale';
      }).length,
    );
    expect(generated.unknownHighRiskMedicationCount).toBe(
      generated.rows.filter((row: { highRisk: boolean; freshnessStatus: string }) => {
        return row.highRisk && row.freshnessStatus === 'unknown';
      }).length,
    );
    expect(generated).toEqual(committed);
  });
});
