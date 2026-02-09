const fs = require('node:fs');
const path = require('node:path');
const { ensurePdftotext, extractText } = require('./pdf-utils');
const { collectFiles } = require('./fs-utils');

function extractMed(medName) {
  ensurePdftotext();

  const medDir = path.resolve('infarmed', medName);

  if (!fs.existsSync(medDir)) {
    throw new Error(`Med folder not found: ${medDir}`);
  }

  const pdfs = collectFiles(medDir, '.pdf');
  if (pdfs.length === 0) {
    console.log(`No PDFs found in ${medDir}`);
    return;
  }

  for (const pdf of pdfs) {
    const txtPath = pdf.replace(/\.pdf$/i, '.txt');
    extractText(pdf, txtPath);
    console.log(`Extracted text: ${txtPath}`);
  }
}

module.exports = {
  extractMed
};
