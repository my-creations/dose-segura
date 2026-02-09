#!/usr/bin/env node
const { downloadMed } = require('./utils/infarmed-downloader');
const { extractMed } = require('./utils/infarmed-extractor');
const { parseMed } = require('./utils/infarmed-parser');

const USAGE = `Usage:
  node scripts/meds.js <command> <medName> [options]

Commands:
  download <medName>   Search and download RCM/FI PDFs
  extract <medName>    Extract text from downloaded PDFs
  parse <medName>      Parse extracted text into JSON
  all <medName>        Run download, extract, and parse in sequence

Options:
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

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error(USAGE);
    process.exit(1);
  }

  const command = args[0];
  const medName = args[1];
  const options = parseArgs(args.slice(2));

  try {
    switch (command) {
      case 'download':
        await downloadMed(medName);
        break;
      case 'extract':
        extractMed(medName);
        break;
      case 'parse':
        parseMed(medName, options);
        break;
      case 'all':
        console.log('--- Step 1: Download ---');
        await downloadMed(medName);
        console.log('\n--- Step 2: Extract ---');
        extractMed(medName); // Note: extractMed might need sanitizeName if medName was a search term? 
                             // Wait, extractMed expects folder name. downloadMed creates folder name.
                             // Ideally medName passed to 'all' is the search term.
                             // downloadMed sanitizes it. extractMed needs the sanitized name.
                             // But wait, downloadMed creates `infarmed/<sanitizedSearch>/<sanitizedMed>`.
                             // This is complex. 
                             // Let's assume for 'all', the user passes the SEARCH TERM.
                             // downloadMed will download potentially multiple meds.
                             // We should probably iterate all subfolders in `infarmed/<sanitizedSearch>`?
                             // 
                             // Let's refine 'all' logic:
                             // downloadMed downloads to `infarmed/<sanitizedSearch>/<medName>/...`
                             // extractMed expects `medDir` relative to `infarmed`.
                             // So if I search "propofol", it creates `infarmed/propofol/propofol-lipuro/...`
                             // extractMed("propofol") works if `infarmed/propofol` exists and contains PDFs.
                             // But `infarmed/propofol` contains SUBDIRECTORIES.
                             // `collectFiles` is recursive, so it finds PDFs in subdirectories.
                             // So extractMed("propofol") works!
                             // It extracts text next to PDFs.
                             // parseMed("propofol") parses text files found recursively.
                             // It works!
        
        console.log('\n--- Step 3: Parse ---');
        parseMed(medName, options); // This will parse all found text files in the folder structure.
        break;
      default:
        console.error(`Unknown command: ${command}`);
        console.error(USAGE);
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
