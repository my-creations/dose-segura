const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const USAGE = `Usage:
  node scripts/extract-infarmed-pdf.js <pdfPath> <outTxtPath>

Requires Poppler's pdftotext in PATH.
Example:
  node scripts/extract-infarmed-pdf.js infarmed/propofol/rcm/50368-rcm.pdf infarmed/propofol/rcm/50368-rcm.txt
`;

function ensurePdftotext() {
  try {
    execFileSync('pdftotext', ['-v'], { stdio: 'ignore' });
  } catch (error) {
    throw new Error('pdftotext not found. Install Poppler and ensure pdftotext is in PATH.');
  }
}

function normalizeArgs(args) {
  if (args.length < 2) {
    console.error(USAGE);
    process.exit(1);
  }

  const pdfPath = path.resolve(args[0]);
  const outTxtPath = path.resolve(args[1]);

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF not found: ${pdfPath}`);
  }

  return { pdfPath, outTxtPath };
}

function ensureOutputDir(outTxtPath) {
  const dir = path.dirname(outTxtPath);
  fs.mkdirSync(dir, { recursive: true });
}

function extractText(pdfPath, outTxtPath) {
  execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdfPath, outTxtPath], {
    stdio: 'inherit',
  });
}

function main() {
  const args = process.argv.slice(2);
  ensurePdftotext();

  const { pdfPath, outTxtPath } = normalizeArgs(args);
  ensureOutputDir(outTxtPath);

  extractText(pdfPath, outTxtPath);
  console.log(`Extracted text: ${outTxtPath}`);
}

main();
