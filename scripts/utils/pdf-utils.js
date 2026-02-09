const { execFileSync } = require('node:child_process');

function ensurePdftotext() {
  try {
    execFileSync('pdftotext', ['-v'], { stdio: 'ignore' });
  } catch (error) {
    throw new Error('pdftotext not found. Install Poppler and ensure pdftotext is in PATH.');
  }
}

function extractText(pdfPath, outTxtPath) {
  execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', pdfPath, outTxtPath], {
    stdio: 'inherit',
  });
}

module.exports = {
  ensurePdftotext,
  extractText
};
