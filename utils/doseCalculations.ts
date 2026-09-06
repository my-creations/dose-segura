export type CalculationMode = 'dose-by-weight' | 'volume' | 'mg-per-kg';

export type CalculationError = 'empty' | 'invalid' | 'zeroOrNegative';

export type ParseResult =
  | { status: 'ok'; value: number }
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'zero' }
  | { status: 'negative' };

export type DoseCalculationSuccess = {
  ok: true;
  value: number;
  unit: string;
  formula: string;
  secondary?: {
    value: number;
    unit: string;
    formula: string;
  };
};

export type DoseCalculationFailure = {
  ok: false;
  error: CalculationError;
};

export type DoseCalculationResult = DoseCalculationSuccess | DoseCalculationFailure;

export const DEFAULT_DOSE_UNIT = 'mg';
export const DEFAULT_WEIGHT_UNIT = 'kg';
export const DEFAULT_VOLUME_UNIT = 'mL';
export const DEFAULT_CONCENTRATION_UNIT = 'mg/mL';
export const DEFAULT_MG_PER_KG_UNIT = 'mg/kg';

const MAX_FRACTION_DIGITS = 4;
const SIGNIFICANT_DIGITS = 4;
const FRACTION_DIGITS_CAP = 15;
/** Max digits when searching for an exact terminating reconstruction before the 4 dp fallback. */
const TERMINATING_FRACTION_DIGITS_CAP = 12;
const LARGE_RELATIVE_ERROR = 0.05;

function isThousandsHead(group: string): boolean {
  return /^[1-9]\d{0,2}$/.test(group);
}

function isThousandsGroup(group: string): boolean {
  return /^\d{3}$/.test(group);
}

function integerWithOptionalThousands(integerPart: string): string | null {
  const groups = integerPart.split('.');
  if (groups.some((group) => group === '' || !/^\d+$/.test(group))) {
    return null;
  }
  if (groups.length === 1) {
    return groups[0];
  }
  if (!isThousandsHead(groups[0]) || !groups.slice(1).every(isThousandsGroup)) {
    return null;
  }
  return groups.join('');
}

/**
 * A single period + 3 digits is ambiguous for non-zero left (`1.125` could be 1.125 or 1125).
 * Accept only the canonical PT thousands form `d.000` / `dd.000` / `ddd.000` of an integer >= 1000.
 * (`0.xxx` is handled separately as an unambiguous decimal.)
 */
function isCanonicalSinglePeriodThousands(left: string, right: string): boolean {
  return isThousandsHead(left) && right === '000' && Number(`${left}${right}`) >= 1000;
}

/**
 * PT-first decimal: `1.000` is one thousand, `1,5` / `1.5` are one-and-a-half.
 * Rejects scientific notation and mixed comma groups such as `1,2,3`.
 */
function normalizePortugueseDecimal(input: string): string | null {
  if (!/^-?\d+(?:[.,]\d+)*$/.test(input)) {
    return null;
  }

  const sign = input.startsWith('-') ? '-' : '';
  const unsigned = sign ? input.slice(1) : input;
  const hasComma = unsigned.includes(',');
  const hasDot = unsigned.includes('.');

  if (hasComma && hasDot) {
    if ((unsigned.match(/,/g) ?? []).length !== 1) {
      return null;
    }
    const commaIndex = unsigned.indexOf(',');
    if (unsigned.indexOf('.') > commaIndex) {
      return null;
    }
    const integerPart = unsigned.slice(0, commaIndex);
    const fractionPart = unsigned.slice(commaIndex + 1);
    const integerDigits = integerWithOptionalThousands(integerPart);
    if (integerDigits == null || !/^\d+$/.test(fractionPart)) {
      return null;
    }
    return `${sign}${integerDigits}.${fractionPart}`;
  }

  if (hasComma) {
    if ((unsigned.match(/,/g) ?? []).length !== 1) {
      return null;
    }
    return `${sign}${unsigned.replace(',', '.')}`;
  }

  if (hasDot) {
    const groups = unsigned.split('.');
    if (groups.some((group) => group === '' || !/^\d+$/.test(group))) {
      return null;
    }

    const last = groups[groups.length - 1];
    const head = groups.slice(0, -1);

    // 1-2 fractional digits: decimal (`1.5`, `1.50`). Integer may contain thousands groups.
    if (last.length === 1 || last.length === 2) {
      const integerDigits = integerWithOptionalThousands(head.join('.'));
      if (integerDigits == null) {
        return null;
      }
      return `${sign}${integerDigits}.${last}`;
    }

    // Multiple dots: thousands if every group after the first has exactly 3 digits.
    if (groups.length > 2) {
      if (!isThousandsHead(groups[0]) || !groups.slice(1).every(isThousandsGroup)) {
        return null;
      }
      return `${sign}${groups.join('')}`;
    }

    // Single period with exactly 3 digits: thousands only for canonical `1.000` / `12.000`.
    // Integer part `0` cannot be PT thousands, so `0.125` / `0.500` are unambiguous decimals.
    // Non-zero left that is not canonical thousands (`1.125`, `2.500`) stays rejected.
    if (groups.length === 2 && last.length === 3) {
      if (isCanonicalSinglePeriodThousands(groups[0], last)) {
        return `${sign}${groups[0]}${last}`;
      }
      if (groups[0] === '0') {
        return `${sign}0.${last}`;
      }
      return null;
    }

    // 4+ fractional digits cannot be a thousands grouping; treat as a decimal.
    if (groups.length === 2 && last.length > 3) {
      return `${sign}${groups[0]}.${last}`;
    }

    return null;
  }

  return `${sign}${unsigned}`;
}

function roundToFractionDigits(value: number, fractionDigits: number): number {
  if (!Number.isFinite(value)) {
    return Number.NaN;
  }
  if (fractionDigits <= 0) {
    return Math.round(value);
  }

  const factor = 10 ** fractionDigits;
  if (!Number.isFinite(factor) || Math.abs(value) > Number.MAX_VALUE / factor) {
    // Intermediate would overflow to Infinity; refuse rather than corrupt the display.
    return Number.NaN;
  }

  const scaled = value * factor;
  if (!Number.isFinite(scaled)) {
    return Number.NaN;
  }

  return Math.round(scaled) / factor;
}

function formatRounded(rounded: number, fractionDigits: number): string {
  if (!Number.isFinite(rounded)) {
    return '';
  }

  const fixed = rounded.toFixed(fractionDigits);
  // `toFixed` switches to exponential for |n| >= 1e21; that is not auditable PT decimal.
  if (!/^-?\d+(?:\.\d+)?$/.test(fixed)) {
    return '';
  }

  const [integerPart, fractionPart] = fixed.split('.');
  if (!fractionPart || /^0+$/.test(fractionPart)) {
    return integerPart;
  }
  return `${integerPart},${fractionPart.replace(/0+$/, '')}`;
}

/**
 * Parse a nurse-typed decimal. Accepts comma or period as the decimal separator.
 * Empty / in-progress input is `empty`; zero and negative are distinct from invalid text.
 * Only surrounding whitespace is stripped; internal spaces (e.g. `1 0`) are invalid.
 */
export function parseDecimalInput(raw: string | null | undefined): ParseResult {
  if (raw == null) {
    return { status: 'empty' };
  }

  const trimmed = raw.trim();
  if (trimmed === '') {
    return { status: 'empty' };
  }

  const withoutTrailingSeparator = trimmed.replace(/[,.]$/, '');
  if (withoutTrailingSeparator === '' || withoutTrailingSeparator === '-') {
    return { status: 'empty' };
  }

  const normalized = normalizePortugueseDecimal(withoutTrailingSeparator);
  if (normalized == null || !/^-?\d+(\.\d+)?$/.test(normalized)) {
    return { status: 'invalid' };
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return { status: 'invalid' };
  }
  if (value < 0) {
    return { status: 'negative' };
  }
  if (value === 0) {
    return { status: 'zero' };
  }

  return { status: 'ok', value };
}

function floatEpsilon(value: number): number {
  return Number.EPSILON * Math.max(Math.abs(value), Number.MIN_VALUE) * 16;
}

function isReconstructed(value: number, rounded: number): boolean {
  return Math.abs(rounded - value) <= floatEpsilon(value);
}

function fractionDigitsNeeded(value: number, maxFractionDigits: number): number {
  const abs = Math.abs(value);
  const ordinary = roundToFractionDigits(value, maxFractionDigits);
  const ordinaryOk = Number.isFinite(ordinary);
  const relativeError = ordinaryOk ? Math.abs(ordinary - value) / abs : Number.POSITIVE_INFINITY;
  const tooSmallForOrdinary = abs < 10 ** -maxFractionDigits;

  // Default 4 dp when that rounding is the same value (within a few ULPs).
  if (ordinaryOk && ordinary !== 0 && !tooSmallForOrdinary && isReconstructed(value, ordinary)) {
    return maxFractionDigits;
  }

  // 4 dp hid trailing non-zero digits that change the product (`0.50004` → `0,5`,
  // or `1,234567891` → `1,2346`). Expand until the displayed number reconstructs
  // the value. Cap below float-noise territory (~13+ dp for 75/7) so repeating
  // expansions still fall through to the 4 dp relative-error path as `10,7143`.
  for (let digits = maxFractionDigits + 1; digits <= TERMINATING_FRACTION_DIGITS_CAP; digits += 1) {
    const rounded = roundToFractionDigits(value, digits);
    if (Number.isFinite(rounded) && rounded !== 0 && isReconstructed(value, rounded)) {
      return digits;
    }
  }

  // Repeating / non-terminating expansions keep 4 dp unless that rounds to 0 or
  // overstates badly (`0.00006`).
  if (
    ordinaryOk &&
    ordinary !== 0 &&
    !tooSmallForOrdinary &&
    relativeError <= LARGE_RELATIVE_ERROR
  ) {
    return maxFractionDigits;
  }

  const magnitude = Math.floor(Math.log10(abs));
  if (!Number.isFinite(magnitude)) {
    return maxFractionDigits;
  }

  return Math.min(
    FRACTION_DIGITS_CAP,
    Math.max(maxFractionDigits, SIGNIFICANT_DIGITS - magnitude - 1),
  );
}

export function formatDecimal(value: number, maxFractionDigits = MAX_FRACTION_DIGITS): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  if (value === 0) {
    return '0';
  }

  let digits = fractionDigitsNeeded(value, maxFractionDigits);
  let rounded = roundToFractionDigits(value, digits);

  while (rounded === 0 && digits < FRACTION_DIGITS_CAP) {
    digits += 1;
    rounded = roundToFractionDigits(value, digits);
  }

  if (!Number.isFinite(rounded)) {
    return '';
  }

  if (rounded === 0) {
    return formatRounded(value, FRACTION_DIGITS_CAP);
  }

  return formatRounded(rounded, digits);
}

function combineParses(
  parses: ParseResult[],
): { ok: true; values: number[] } | DoseCalculationFailure {
  let sawEmpty = false;

  for (const parsed of parses) {
    if (parsed.status === 'invalid') {
      return { ok: false, error: 'invalid' };
    }
    if (parsed.status === 'zero' || parsed.status === 'negative') {
      return { ok: false, error: 'zeroOrNegative' };
    }
    if (parsed.status === 'empty') {
      sawEmpty = true;
    }
  }

  if (sawEmpty) {
    return { ok: false, error: 'empty' };
  }

  return {
    ok: true,
    values: parses.map((parsed) => (parsed as { status: 'ok'; value: number }).value),
  };
}

function finitePositiveOrError(value: number): DoseCalculationFailure | null {
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: 'zeroOrNegative' };
  }
  // Refuse magnitudes we cannot render as an auditable non-zero PT decimal
  // (overflow / 1e21+, or positive values that round/display as `0`).
  const displayed = formatDecimal(value);
  if (displayed === '' || displayed === '0') {
    return { ok: false, error: 'zeroOrNegative' };
  }
  return null;
}

function displayableOperandsOrError(values: number[]): DoseCalculationFailure | null {
  for (const value of values) {
    const invalid = finitePositiveOrError(value);
    if (invalid) {
      return invalid;
    }
  }
  return null;
}

export function calculateDoseByWeight(input: {
  doseRef: string;
  weightRef: string;
  patientWeight: string;
}): DoseCalculationResult {
  const combined = combineParses([
    parseDecimalInput(input.doseRef),
    parseDecimalInput(input.weightRef),
    parseDecimalInput(input.patientWeight),
  ]);
  if (!combined.ok) {
    return combined;
  }

  const [doseRef, weightRef, patientWeight] = combined.values;
  const invalidOperands = displayableOperandsOrError([doseRef, weightRef, patientWeight]);
  if (invalidOperands) {
    return invalidOperands;
  }

  const value = (doseRef * patientWeight) / weightRef;
  const invalid = finitePositiveOrError(value);
  if (invalid) {
    return invalid;
  }

  return {
    ok: true,
    value,
    unit: DEFAULT_DOSE_UNIT,
    formula: `${formatDecimal(doseRef)} ${DEFAULT_DOSE_UNIT} × ${formatDecimal(patientWeight)} ${DEFAULT_WEIGHT_UNIT} ÷ ${formatDecimal(weightRef)} ${DEFAULT_WEIGHT_UNIT} = ${formatDecimal(value)} ${DEFAULT_DOSE_UNIT}`,
  };
}

export function calculateVolumeToDraw(input: {
  prescribedDose: string;
  concentration: string;
}): DoseCalculationResult {
  const combined = combineParses([
    parseDecimalInput(input.prescribedDose),
    parseDecimalInput(input.concentration),
  ]);
  if (!combined.ok) {
    return combined;
  }

  const [prescribedDose, concentration] = combined.values;
  const invalidOperands = displayableOperandsOrError([prescribedDose, concentration]);
  if (invalidOperands) {
    return invalidOperands;
  }

  const value = prescribedDose / concentration;
  const invalid = finitePositiveOrError(value);
  if (invalid) {
    return invalid;
  }

  return {
    ok: true,
    value,
    unit: DEFAULT_VOLUME_UNIT,
    formula: `${formatDecimal(prescribedDose)} ${DEFAULT_DOSE_UNIT} ÷ ${formatDecimal(concentration)} ${DEFAULT_CONCENTRATION_UNIT} = ${formatDecimal(value)} ${DEFAULT_VOLUME_UNIT}`,
  };
}

export function calculateMgPerKg(input: {
  dosePerKg: string;
  patientWeight: string;
  concentration?: string;
}): DoseCalculationResult {
  const combined = combineParses([
    parseDecimalInput(input.dosePerKg),
    parseDecimalInput(input.patientWeight),
  ]);
  if (!combined.ok) {
    return combined;
  }

  const [dosePerKg, patientWeight] = combined.values;
  const invalidOperands = displayableOperandsOrError([dosePerKg, patientWeight]);
  if (invalidOperands) {
    return invalidOperands;
  }

  const dose = dosePerKg * patientWeight;
  const invalidDose = finitePositiveOrError(dose);
  if (invalidDose) {
    return invalidDose;
  }

  const result: DoseCalculationSuccess = {
    ok: true,
    value: dose,
    unit: DEFAULT_DOSE_UNIT,
    formula: `${formatDecimal(dosePerKg)} ${DEFAULT_MG_PER_KG_UNIT} × ${formatDecimal(patientWeight)} ${DEFAULT_WEIGHT_UNIT} = ${formatDecimal(dose)} ${DEFAULT_DOSE_UNIT}`,
  };

  const concentrationParse = parseDecimalInput(input.concentration ?? '');
  if (concentrationParse.status === 'empty') {
    return result;
  }
  if (concentrationParse.status === 'invalid') {
    return { ok: false, error: 'invalid' };
  }
  if (concentrationParse.status !== 'ok') {
    return { ok: false, error: 'zeroOrNegative' };
  }

  const invalidConcentration = finitePositiveOrError(concentrationParse.value);
  if (invalidConcentration) {
    return invalidConcentration;
  }

  const volume = dose / concentrationParse.value;
  const invalidVolume = finitePositiveOrError(volume);
  if (invalidVolume) {
    return invalidVolume;
  }

  return {
    ...result,
    secondary: {
      value: volume,
      unit: DEFAULT_VOLUME_UNIT,
      formula: `${formatDecimal(dose)} ${DEFAULT_DOSE_UNIT} ÷ ${formatDecimal(concentrationParse.value)} ${DEFAULT_CONCENTRATION_UNIT} = ${formatDecimal(volume)} ${DEFAULT_VOLUME_UNIT}`,
    },
  };
}
