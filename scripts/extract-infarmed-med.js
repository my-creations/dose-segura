const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const USAGE = `Usage:
  node scripts/extract-infarmed-med.js <medId>

Requires Poppler's pdftotext in PATH.
Example:
  node scripts/extract-infarmed-med.js propofol
`;

function ensurePdftotext() {
  try {
    execFileSync('pdftotext', ['-v'], { stdio: 'ignore' });
  } catch (error) {
    throw new Error('pdftotext not found. Install Poppler and ensure pdftotext is in PATH.');
  }
}

function collectPdfFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectPdfFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractPdf(pdfPath) {
  const txtPath = pdfPath.replace(/\.pdf$/i, '.txt');
  execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdfPath, txtPath], {
    stdio: 'inherit',
  });
  return txtPath;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error(USAGE);
    process.exit(1);
  }

  ensurePdftotext();

  const medId = args[0];
  const medDir = path.resolve('infarmed', medId);

  if (!fs.existsSync(medDir)) {
    throw new Error(`Med folder not found: ${medDir}`);
  }

  const pdfs = collectPdfFiles(medDir);
  if (pdfs.length === 0) {
    console.log(`No PDFs found in ${medDir}`);
    return;
  }

  for (const pdf of pdfs) {
    const txt = extractPdf(pdf);
    console.log(`Extracted text: ${txt}`);
  }
}

main();
