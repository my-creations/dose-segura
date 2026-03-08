#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const env = { ...process.env };
delete env.NO_COLOR;

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(command, ['expo', 'export', '-p', 'web'], {
  stdio: 'inherit',
  env,
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
