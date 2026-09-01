import fs from 'fs';
import path from 'path';

const { parseArgs, parseCli, run, USAGE } = require('../../scripts/meds');

describe('Infarmed fetch CLI', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes bun run infarmed:fetch in package.json', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(pkg.scripts['infarmed:fetch']).toBe('node scripts/meds.js fetch');
  });

  it('documents the bun CLI in usage text', () => {
    expect(USAGE).toContain('bun run infarmed:fetch -- <medId>');
    expect(USAGE).toContain('fetch <medName>');
  });

  it('parses parse-only flags', () => {
    expect(parseArgs(['--out', 'out.json', '--infarmed-id', '123', '--best-match'])).toEqual({
      out: 'out.json',
      infarmedId: '123',
      bestMatch: true,
    });
  });

  it('treats --help as help without requiring a medId', () => {
    expect(parseCli(['--help'])).toEqual({ help: true });
    expect(parseCli(['-h'])).toEqual({ help: true });
    expect(parseCli([])).toEqual({ error: 'missing-args' });
    expect(parseCli(['fetch'])).toEqual({ error: 'missing-args' });
  });

  it('accepts fetch and all as the download+extract+parse command', () => {
    expect(parseCli(['fetch', 'propofol'])).toEqual({
      command: 'fetch',
      medName: 'propofol',
      options: {},
    });
    expect(parseCli(['all', 'propofol', '--best-match'])).toEqual({
      command: 'all',
      medName: 'propofol',
      options: { bestMatch: true },
    });
  });

  it('runs download then extract then parse without contacting Infarmed', async () => {
    const downloadMed = jest.fn().mockResolvedValue(undefined);
    const extractMed = jest.fn();
    const parseMed = jest.fn();
    const exit = jest.fn();

    const result = await run(['fetch', 'propofol'], {
      downloadMed,
      extractMed,
      parseMed,
      exit,
    });

    expect(result).toEqual({ status: 'ok', command: 'fetch', medName: 'propofol' });
    expect(downloadMed).toHaveBeenCalledWith('propofol');
    expect(extractMed).toHaveBeenCalledWith('propofol');
    expect(parseMed).toHaveBeenCalledWith('propofol', {});
    expect(exit).not.toHaveBeenCalled();
    expect(downloadMed.mock.invocationCallOrder[0]).toBeLessThan(
      extractMed.mock.invocationCallOrder[0],
    );
    expect(extractMed.mock.invocationCallOrder[0]).toBeLessThan(
      parseMed.mock.invocationCallOrder[0],
    );
  });

  it('treats all as an alias for fetch', async () => {
    const downloadMed = jest.fn().mockResolvedValue(undefined);
    const extractMed = jest.fn();
    const parseMed = jest.fn();
    const exit = jest.fn();

    const result = await run(['all', 'midazolam'], {
      downloadMed,
      extractMed,
      parseMed,
      exit,
    });

    expect(result.status).toBe('ok');
    expect(downloadMed).toHaveBeenCalledWith('midazolam');
    expect(extractMed).toHaveBeenCalledWith('midazolam');
    expect(parseMed).toHaveBeenCalledWith('midazolam', {});
  });
});
