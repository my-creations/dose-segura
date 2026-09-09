#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const { generateServiceWorker } = require('./generate-sw-precache');

const env = { ...process.env };
delete env.NO_COLOR;

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(command, ['expo', 'export', '-p', 'web'], {
  stdio: 'inherit',
  env,
});

if (typeof result.status === 'number') {
  if (result.status !== 0) {
    process.exit(result.status);
  }
} else {
  process.exit(1);
}

// Post-export hook: seed sw.js from current dist filenames.
// fix-web-build.js re-runs generation after assets/node_modules → assets/libs.
try {
  generateServiceWorker();
} catch (error) {
  console.warn(`⚠️  Service worker precache not generated yet: ${error.message}`);
}

process.exit(0);
