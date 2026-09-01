#!/usr/bin/env node
const { downloadMed } = require('./utils/infarmed-downloader');
const { extractMed } = require('./utils/infarmed-extractor');
const { parseMed } = require('./utils/infarmed-parser');

const USAGE = `Usage:
  bun run infarmed:fetch -- <medId>
  node scripts/meds.js <command> <medName> [options]

Commands:
  download <medName>   Search and download RCM/FI PDFs into infarmed/<medId>/
  extract <medName>    Extract text from downloaded PDFs
  parse <medName>      Parse extracted text into JSON
  fetch <medName>      Download, extract, and parse in sequence
  all <medName>        Alias for fetch

Options:
  --help, -h           Show this help
  --out <path>         (parse only) Output path for JSON
  --infarmed-id <id>   (parse only) Filter by Infarmed ID
  --best-match         (parse only) Use best match from meta.json
`;

function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out') {
      options.out = args[i + 1];
      i++;
    } else if (args[i] === '--infarmed-id') {
      options.infarmedId = args[i + 1];
      i++;
    } else if (args[i] === '--best-match') {
      options.bestMatch = true;
    }
  }
  return options;
}

function parseCli(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    return { help: true };
  }

  if (argv.length < 2) {
    return { error: 'missing-args' };
  }

  return {
    command: argv[0],
    medName: argv[1],
    options: parseArgs(argv.slice(2)),
  };
}

async function runFetch(medName, options, deps) {
  console.log('--- Step 1: Download ---');
  await deps.downloadMed(medName);
  console.log('\n--- Step 2: Extract ---');
  deps.extractMed(medName);
  console.log('\n--- Step 3: Parse ---');
  deps.parseMed(medName, options);
}

function defaultDeps() {
  return {
    downloadMed,
    extractMed,
    parseMed,
    logError: (message) => console.error(message),
    exit: (code) => process.exit(code),
  };
}

async function run(argv, overrides = {}) {
  const deps = { ...defaultDeps(), ...overrides };
  const parsed = parseCli(argv);

  if (parsed.help) {
    console.log(USAGE);
    deps.exit(0);
    return { status: 'help' };
  }

  if (parsed.error) {
    deps.logError(USAGE);
    deps.exit(1);
    return { status: 'error', reason: parsed.error };
  }

  const { command, medName, options } = parsed;

  try {
    switch (command) {
      case 'download':
        await deps.downloadMed(medName);
        break;
      case 'extract':
        deps.extractMed(medName);
        break;
      case 'parse':
        deps.parseMed(medName, options);
        break;
      case 'fetch':
      case 'all':
        await runFetch(medName, options, deps);
        break;
      default:
        deps.logError(`Unknown command: ${command}`);
        deps.logError(USAGE);
        deps.exit(1);
        return { status: 'error', reason: 'unknown-command' };
    }

    return { status: 'ok', command, medName };
  } catch (error) {
    deps.logError(`Error: ${error.message}`);
    deps.exit(1);
    return { status: 'error', reason: error.message };
  }
}

async function main() {
  await run(process.argv.slice(2));
}

if (require.main === module) {
  main();
}

module.exports = {
  USAGE,
  parseArgs,
  parseCli,
  run,
};
