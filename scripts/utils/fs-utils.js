const fs = require('node:fs');
const path = require('node:path');

function collectFiles(rootDir, extension) {
  if (!fs.existsSync(rootDir)) return [];
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, extension));
    } else if (entry.isFile()) {
      if (!extension || entry.name.toLowerCase().endsWith(extension.toLowerCase())) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

function ensureOutputDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

module.exports = {
  collectFiles,
  ensureOutputDir
};
