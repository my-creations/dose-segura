import {
  calculateDoseByWeight,
  calculateMgPerKg,
  calculateVolumeToDraw,
  formatDecimal,
  parseDecimalInput,
  type DoseCalculationResult,
  type DoseCalculationSuccess,
} from '@/utils/doseCalculations';

function expectOkPositive(result: DoseCalculationResult): asserts result is DoseCalculationSuccess {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error('expected ok result');
  }
  expect(Number.isFinite(result.value)).toBe(true);
  expect(result.value).toBeGreaterThan(0);
  const formatted = formatDecimal(result.value);
  expect(formatted).not.toBe('0');
  expect(result.formula).toContain(`= ${formatted} ${result.unit}`);
}

function expectDisplayedValue(result: DoseCalculationSuccess, expected: number) {
  expect(result.value).toBeCloseTo(expected);
  expect(formatDecimal(result.value)).toBe(formatDecimal(expected));
  expect(result.formula.endsWith(`= ${formatDecimal(result.value)} ${result.unit}`)).toBe(true);
}

describe('parseDecimalInput', () => {
  it('treats empty and whitespace as empty', () => {
    expect(parseDecimalInput('')).toEqual({ status: 'empty' });
    expect(parseDecimalInput('   ')).toEqual({ status: 'empty' });
    expect(parseDecimalInput(null)).toEqual({ status: 'empty' });
    expect(parseDecimalInput(undefined)).toEqual({ status: 'empty' });
    expect(parseDecimalInput(',')).toEqual({ status: 'empty' });
    expect(parseDecimalInput('.')).toEqual({ status: 'empty' });
    expect(parseDecimalInput(' - ')).toEqual({ status: 'empty' });
  });

  it('parses comma and period decimals, trailing separators, and whitespace', () => {
    expect(parseDecimalInput('1,5')).toEqual({ status: 'ok', value: 1.5 });
    expect(parseDecimalInput('1.5')).toEqual({ status: 'ok', value: 1.5 });
    expect(parseDecimalInput('1.50')).toEqual({ status: 'ok', value: 1.5 });
    expect(parseDecimalInput(' 7,5 ')).toEqual({ status: 'ok', value: 7.5 });
    expect(parseDecimalInput('10')).toEqual({ status: 'ok', value: 10 });
    expect(parseDecimalInput('1,')).toEqual({ status: 'ok', value: 1 });
    expect(parseDecimalInput('1.')).toEqual({ status: 'ok', value: 1 });
    expect(parseDecimalInput(' 1,5 ')).toEqual({ status: 'ok', value: 1.5 });
  });

  it('rejects arbitrarily spaced digit strings instead of concatenating them', () => {
    expect(parseDecimalInput(' 1,5 ')).toEqual({ status: 'ok', value: 1.5 });
    expect(parseDecimalInput('1 0')).toEqual({ status: 'invalid' });
    expect(parseDecimalInput('10 00')).toEqual({ status: 'invalid' });
    expect(parseDecimalInput('1.000')).toEqual({ status: 'ok', value: 1000 });
    expect(parseDecimalInput('  12 , 5  ')).toEqual({ status: 'invalid' });
  });

  it.each([
    ['1.000', 1000],
    ['10.000', 10000],
    ['12.000', 12000],
    ['1.000.000', 1000000],
    ['1.000,5', 1000.5],
    ['1,5', 1.5],
    ['1.5', 1.5],
  ] as const)('parses %s as %s', (input, value) => {
    expect(parseDecimalInput(input)).toEqual({ status: 'ok', value });
  });

  it('accepts comma-decimal with thousands groups as unambiguous PT', () => {
    expect(parseDecimalInput('1.125,5')).toEqual({ status: 'ok', value: 1125.5 });
    expect(parseDecimalInput('1.234.567')).toEqual({ status: 'ok', value: 1234567 });
  });

  it.each([
    ['0.125', 0.125],
    ['0.500', 0.5],
  ] as const)('accepts unambiguous 0.xxx period decimal %s as %s', (input, value) => {
    expect(parseDecimalInput(input)).toEqual({ status: 'ok', value });
  });

  it.each(['1.125', '1.001', '2.500'])(
    'rejects ambiguous single-period fraction %s as invalid',
    (input) => {
      expect(parseDecimalInput(input)).toEqual({ status: 'invalid' });
    },
  );

  it('treats zero and negative as distinct from invalid text', () => {
    expect(parseDecimalInput('0')).toEqual({ status: 'zero' });
    expect(parseDecimalInput('0,0')).toEqual({ status: 'zero' });
    expect(parseDecimalInput('0.0')).toEqual({ status: 'zero' });
    expect(parseDecimalInput('-3')).toEqual({ status: 'negative' });
    expect(parseDecimalInput('-0,5')).toEqual({ status: 'negative' });
    expect(parseDecimalInput('-1.5')).toEqual({ status: 'negative' });
  });

  it.each(['abc', '1e2', '1E2', '1,2,3', '1.2.3', '1.2.3.4', '1 0', '10 00'])(
    'rejects non-decimal text %s',
    (input) => {
      expect(parseDecimalInput(input)).toEqual({ status: 'invalid' });
    },
  );
});

describe('formatDecimal', () => {
  it('uses a Portuguese decimal comma and strips trailing zeros', () => {
    expect(formatDecimal(3)).toBe('3');
    expect(formatDecimal(0.5)).toBe('0,5');
    expect(formatDecimal(10.714285714285714)).toBe('10,7143');
    expect(formatDecimal(Number.POSITIVE_INFINITY)).toBe('');
    expect(formatDecimal(Number.NaN)).toBe('');
  });

  it('keeps trailing non-zero digits that 4 dp rounding would hide', () => {
    expect(formatDecimal(0.50004)).toBe('0,50004');
    expect(formatDecimal(0.50004)).not.toBe('0,5');
  });

  it('never renders 0 for a tiny positive dose', () => {
    const formatted = formatDecimal(0.00004);
    expect(formatted).not.toBe('0');
    expect(formatted).toBe('0,00004');
    expect(formatted).toContain(',');
    const numeric = Number(formatted.replace(',', '.'));
    expect(numeric).toBeGreaterThan(0);
    expect(numeric).toBeCloseTo(0.00004);
  });

  it('keeps significant digits for values that would overstate at 4 dp', () => {
    expect(formatDecimal(0.00006)).not.toBe('0,0001');
    expect(formatDecimal(0.00006)).toBe('0,00006');
    expect(formatDecimal(0.00006)).not.toBe('0');
  });

  it('never shows 0 for a finite value greater than 0', () => {
    for (const value of [0.00004, 0.00006, 1e-10, 0.5, 3, 10.714285714285714]) {
      const formatted = formatDecimal(value);
      expect(formatted).not.toBe('0');
      expect(formatted.length).toBeGreaterThan(0);
    }
  });

  it('refuses huge finite magnitudes instead of formatting Infinity', () => {
    expect(formatDecimal(1e305)).toBe('');
    expect(formatDecimal(Number.MAX_VALUE / 2)).toBe('');
    expect(formatDecimal(1e305)).not.toMatch(/Infinity|NaN/i);
  });
});

describe('calculateDoseByWeight', () => {
  it('applies regra de três simples with independently computed numbers', () => {
    const expected = (100 * 7.5) / 70;
    const result = calculateDoseByWeight({
      doseRef: '100',
      weightRef: '70',
      patientWeight: '7,5',
    });

    expectOkPositive(result);
    expectDisplayedValue(result, expected);
    expect(result).toMatchObject({
      ok: true,
      unit: 'mg',
      formula: '100 mg × 7,5 kg ÷ 70 kg = 10,7143 mg',
    });
    expect(formatDecimal(result.value)).toBe('10,7143');
  });

  it('preserves substituted operands so the displayed formula is true', () => {
    const result = calculateDoseByWeight({
      doseRef: '0,50004',
      weightRef: '1',
      patientWeight: '100',
    });

    expectOkPositive(result);
    expectDisplayedValue(result, 0.50004 * 100);
    expect(result.formula).not.toContain('0,5 mg ×');
    expect(result.formula).toContain('0,50004 mg ×');

    const match = result.formula.match(
      /^(\d+(?:,\d+)?) mg × (\d+(?:,\d+)?) kg ÷ (\d+(?:,\d+)?) kg = (\d+(?:,\d+)?) mg$/,
    );
    expect(match).not.toBeNull();
    const parseDisplayed = (text: string) => Number(text.replace(',', '.'));
    const doseRef = parseDisplayed(match![1]);
    const patientWeight = parseDisplayed(match![2]);
    const weightRef = parseDisplayed(match![3]);
    const displayedResult = parseDisplayed(match![4]);
    expect((doseRef * patientWeight) / weightRef).toBeCloseTo(displayedResult, 8);
  });

  it('keeps nine fractional digits so 1,234567891 × 100 stays auditable', () => {
    const result = calculateDoseByWeight({
      doseRef: '1,234567891',
      weightRef: '1',
      patientWeight: '100',
    });

    expectOkPositive(result);
    expectDisplayedValue(result, 1.234567891 * 100);
    expect(formatDecimal(1.234567891)).toBe('1,234567891');
    expect(result.formula).toBe('1,234567891 mg × 100 kg ÷ 1 kg = 123,4567891 mg');
    expect(result.formula).not.toContain('1,2346 mg ×');

    const match = result.formula.match(
      /^(\d+(?:,\d+)?) mg × (\d+(?:,\d+)?) kg ÷ (\d+(?:,\d+)?) kg = (\d+(?:,\d+)?) mg$/,
    );
    expect(match).not.toBeNull();
    const parseDisplayed = (text: string) => Number(text.replace(',', '.'));
    const doseRef = parseDisplayed(match![1]);
    const patientWeight = parseDisplayed(match![2]);
    const weightRef = parseDisplayed(match![3]);
    const displayedResult = parseDisplayed(match![4]);
    expect((doseRef * patientWeight) / weightRef).toBeCloseTo(displayedResult, 10);
  });

  it('rejects a huge positive digit string instead of returning Infinity', () => {
    const huge = `1${'0'.repeat(305)}`;
    expect(parseDecimalInput(huge)).toEqual({ status: 'ok', value: 1e305 });
    expect(formatDecimal(1e305)).toBe('');

    const result = calculateDoseByWeight({
      doseRef: huge,
      weightRef: '1',
      patientWeight: '1',
    });

    expect(result).toEqual({ ok: false, error: 'zeroOrNegative' });
    expect(JSON.stringify(result)).not.toMatch(/Infinity|NaN/i);
  });

  it('returns a whole-number dose without a trailing decimal', () => {
    expect(
      calculateDoseByWeight({
        doseRef: '200',
        weightRef: '10',
        patientWeight: '8',
      }),
    ).toEqual({
      ok: true,
      value: 160,
      unit: 'mg',
      formula: '200 mg × 8 kg ÷ 10 kg = 160 mg',
    });
  });

  it('computes with a thousands-grouped Portuguese input as 1000, not 1', () => {
    expect(
      calculateDoseByWeight({
        doseRef: '1.000',
        weightRef: '10',
        patientWeight: '5',
      }),
    ).toEqual({
      ok: true,
      value: 500,
      unit: 'mg',
      formula: '1000 mg × 5 kg ÷ 10 kg = 500 mg',
    });
  });

  it('computes with 10.000 as ten thousand', () => {
    const expected = (10000 * 2) / 10;
    const result = calculateDoseByWeight({
      doseRef: '10.000',
      weightRef: '10',
      patientWeight: '2',
    });
    expectOkPositive(result);
    expectDisplayedValue(result, expected);
    expect(result.value).toBe(2000);
  });

  it('accepts whitespace and a trailing separator on in-progress input', () => {
    const result = calculateDoseByWeight({
      doseRef: ' 100 ',
      weightRef: '70,',
      patientWeight: '7,5',
    });
    expect(result.ok).toBe(true);
    expectOkPositive(result);
    expectDisplayedValue(result, (100 * 7.5) / 70);
  });

  it('keeps a tiny positive dose visible without overstating 4 dp', () => {
    const result = calculateDoseByWeight({
      doseRef: '0,00006',
      weightRef: '1',
      patientWeight: '1',
    });
    expectOkPositive(result);
    expectDisplayedValue(result, 0.00006);
    expect(formatDecimal(result.value)).toBe('0,00006');
    expect(formatDecimal(result.value)).not.toBe('0,0001');
    expect(result.formula).toContain('0,00006 mg');
  });

  it('returns empty, invalid, or zeroOrNegative instead of Infinity/NaN', () => {
    expect(calculateDoseByWeight({ doseRef: '', weightRef: '70', patientWeight: '7' })).toEqual({
      ok: false,
      error: 'empty',
    });
    expect(calculateDoseByWeight({ doseRef: '   ', weightRef: '70', patientWeight: '7' })).toEqual({
      ok: false,
      error: 'empty',
    });
    expect(calculateDoseByWeight({ doseRef: '100', weightRef: 'abc', patientWeight: '7' })).toEqual(
      {
        ok: false,
        error: 'invalid',
      },
    );
    expect(calculateDoseByWeight({ doseRef: '100', weightRef: '0', patientWeight: '7' })).toEqual({
      ok: false,
      error: 'zeroOrNegative',
    });
    expect(calculateDoseByWeight({ doseRef: '100', weightRef: '-70', patientWeight: '7' })).toEqual(
      {
        ok: false,
        error: 'zeroOrNegative',
      },
    );
  });

  it.each([
    ['1e2', '70', '7'],
    ['100', '1,2,3', '7'],
    ['100', '1.2.3', '7'],
    ['1.125', '70', '7'],
    ['100', '70', '1.125'],
    ['1 0', '70', '7'],
    ['100', '10 00', '7'],
  ] as const)(
    'fails closed for invalid input %s / %s / %s',
    (doseRef, weightRef, patientWeight) => {
      const result = calculateDoseByWeight({ doseRef, weightRef, patientWeight });
      expect(result).toEqual({ ok: false, error: 'invalid' });
    },
  );

  it('accepts unambiguous 0.xxx period decimals in dose-by-weight inputs', () => {
    const result = calculateDoseByWeight({
      doseRef: '0.125',
      weightRef: '0.500',
      patientWeight: '0.250',
    });
    expect(result.ok).toBe(true);
    expectOkPositive(result);
    expectDisplayedValue(result, (0.125 * 0.25) / 0.5);
  });

  it('never returns ok for a non-finite or non-positive value', () => {
    const result = calculateDoseByWeight({
      doseRef: '100',
      weightRef: '70',
      patientWeight: '7,5',
    });
    expect(result.ok).toBe(true);
    expectOkPositive(result);
  });
});

describe('calculateVolumeToDraw', () => {
  it('divides prescribed dose by concentration with independent expected value', () => {
    const expected = 15 / 5;
    const result = calculateVolumeToDraw({
      prescribedDose: '15',
      concentration: '5',
    });
    expectOkPositive(result);
    expectDisplayedValue(result, expected);
    expect(result).toEqual({
      ok: true,
      value: 3,
      unit: 'mL',
      formula: '15 mg ÷ 5 mg/mL = 3 mL',
    });
  });

  it('uses comma decimals and Portuguese thousands', () => {
    const comma = calculateVolumeToDraw({
      prescribedDose: '7,5',
      concentration: '2,5',
    });
    expect(comma.ok).toBe(true);
    expectOkPositive(comma);
    expectDisplayedValue(comma, 7.5 / 2.5);

    const thousands = calculateVolumeToDraw({
      prescribedDose: '1.000',
      concentration: '10',
    });
    expectOkPositive(thousands);
    expectDisplayedValue(thousands, 100);
  });

  it('keeps a tiny positive volume visible instead of rounding the display to 0', () => {
    const result = calculateVolumeToDraw({
      prescribedDose: '0,00004',
      concentration: '1',
    });
    expectOkPositive(result);
    expectDisplayedValue(result, 0.00004);
    expect(formatDecimal(result.value)).not.toBe('0');
    expect(result.formula).toContain('0,00004 mL');
  });

  it('does not overstate 0.00006 as 0,0001', () => {
    const result = calculateVolumeToDraw({
      prescribedDose: '0,00006',
      concentration: '1',
    });
    expectOkPositive(result);
    expectDisplayedValue(result, 0.00006);
    expect(formatDecimal(result.value)).toBe('0,00006');
    expect(formatDecimal(result.value)).not.toBe('0,0001');
  });

  it('does not return Infinity when concentration is zero', () => {
    expect(
      calculateVolumeToDraw({
        prescribedDose: '10',
        concentration: '0',
      }),
    ).toEqual({ ok: false, error: 'zeroOrNegative' });
  });

  it('returns empty when a field is missing or whitespace', () => {
    expect(calculateVolumeToDraw({ prescribedDose: '10', concentration: '' })).toEqual({
      ok: false,
      error: 'empty',
    });
    expect(calculateVolumeToDraw({ prescribedDose: '10', concentration: '   ' })).toEqual({
      ok: false,
      error: 'empty',
    });
  });

  it.each([
    ['abc', '5'],
    ['10', '1e2'],
    ['1,2,3', '5'],
    ['10', '1.2.3'],
    ['1.125', '1'],
  ] as const)('fails closed for invalid volume input %s / %s', (prescribedDose, concentration) => {
    expect(calculateVolumeToDraw({ prescribedDose, concentration })).toEqual({
      ok: false,
      error: 'invalid',
    });
  });

  it('accepts unambiguous 0.xxx period decimals for volume inputs', () => {
    const result = calculateVolumeToDraw({
      prescribedDose: '0.125',
      concentration: '0.500',
    });
    expect(result.ok).toBe(true);
    expectOkPositive(result);
    expectDisplayedValue(result, 0.125 / 0.5);
  });

  it('rejects a positive dose that formatDecimal can only show as 0', () => {
    const result = calculateVolumeToDraw({
      prescribedDose: '0,0000000000000001',
      concentration: '1',
    });
    expect(result).toEqual({ ok: false, error: 'zeroOrNegative' });
    expect(formatDecimal(1e-16)).toBe('0');
  });

  it('rejects a negative prescribed dose', () => {
    expect(calculateVolumeToDraw({ prescribedDose: '-10', concentration: '5' })).toEqual({
      ok: false,
      error: 'zeroOrNegative',
    });
  });
});

describe('calculateMgPerKg', () => {
  it('multiplies mg/kg by weight with independently computed numbers', () => {
    const expected = 10 * 3.2;
    const result = calculateMgPerKg({
      dosePerKg: '10',
      patientWeight: '3,2',
    });
    expectOkPositive(result);
    expectDisplayedValue(result, expected);
    expect(result).toEqual({
      ok: true,
      value: 32,
      unit: 'mg',
      formula: '10 mg/kg × 3,2 kg = 32 mg',
    });
    expect(result.secondary).toBeUndefined();
  });

  it('also returns volume when concentration is filled', () => {
    const dose = 10 * 3.2;
    const volume = dose / 2;
    const result = calculateMgPerKg({
      dosePerKg: '10',
      patientWeight: '3,2',
      concentration: '2',
    });
    expectOkPositive(result);
    expectDisplayedValue(result, dose);
    expect(result.secondary).toEqual({
      value: 16,
      unit: 'mL',
      formula: '32 mg ÷ 2 mg/mL = 16 mL',
    });
    expect(result.secondary?.value).toBeCloseTo(volume);
    expect(formatDecimal(result.secondary!.value)).toBe(formatDecimal(volume));
    expect(result.secondary?.formula).toContain(`= ${formatDecimal(volume)} mL`);
  });

  it('skips volume when concentration is empty or omitted', () => {
    const omitted = calculateMgPerKg({
      dosePerKg: '5',
      patientWeight: '12',
    });
    expectOkPositive(omitted);
    expect(omitted.secondary).toBeUndefined();

    const blank = calculateMgPerKg({
      dosePerKg: '5',
      patientWeight: '12',
      concentration: '',
    });
    expectOkPositive(blank);
    expect(blank.secondary).toBeUndefined();
  });

  it('uses Portuguese thousands and comma decimals', () => {
    const result = calculateMgPerKg({
      dosePerKg: '1.000',
      patientWeight: '1,5',
    });
    expect(result.ok).toBe(true);
    expectOkPositive(result);
    expectDisplayedValue(result, 1500);
  });

  it('keeps tiny mg/kg results visible without 4 dp overstatement', () => {
    const result = calculateMgPerKg({
      dosePerKg: '0,00006',
      patientWeight: '1',
    });
    expectOkPositive(result);
    expectDisplayedValue(result, 0.00006);
    expect(formatDecimal(result.value)).toBe('0,00006');
    expect(formatDecimal(result.value)).not.toBe('0,0001');
  });

  it('rejects a filled but invalid or non-positive concentration', () => {
    expect(
      calculateMgPerKg({
        dosePerKg: '5',
        patientWeight: '12',
        concentration: 'abc',
      }),
    ).toEqual({ ok: false, error: 'invalid' });
    expect(
      calculateMgPerKg({
        dosePerKg: '5',
        patientWeight: '12',
        concentration: '0',
      }),
    ).toEqual({ ok: false, error: 'zeroOrNegative' });
    expect(
      calculateMgPerKg({
        dosePerKg: '5',
        patientWeight: '12',
        concentration: '-2',
      }),
    ).toEqual({ ok: false, error: 'zeroOrNegative' });
    const withZeroPointConcentration = calculateMgPerKg({
      dosePerKg: '5',
      patientWeight: '12',
      concentration: '0.125',
    });
    expectOkPositive(withZeroPointConcentration);
    expect(withZeroPointConcentration.secondary).toEqual({
      value: 60 / 0.125,
      unit: 'mL',
      formula: '60 mg ÷ 0,125 mg/mL = 480 mL',
    });
  });

  it.each([
    ['', '12', 'empty'],
    ['5', '   ', 'empty'],
    ['0', '12', 'zeroOrNegative'],
    ['5', '-3', 'zeroOrNegative'],
    ['1e2', '12', 'invalid'],
    ['1,2,3', '12', 'invalid'],
    ['5', '1.2.3', 'invalid'],
    ['1.125', '12', 'invalid'],
  ] as const)('fails closed for mg/kg input %s / %s with %s', (dosePerKg, patientWeight, error) => {
    expect(calculateMgPerKg({ dosePerKg, patientWeight })).toEqual({
      ok: false,
      error,
    });
  });

  it('accepts unambiguous 0.xxx period decimals for mg/kg inputs', () => {
    const result = calculateMgPerKg({
      dosePerKg: '0.125',
      patientWeight: '0.500',
    });
    expect(result.ok).toBe(true);
    expectOkPositive(result);
    expectDisplayedValue(result, 0.125 * 0.5);
  });
});
