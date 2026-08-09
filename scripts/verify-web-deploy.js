#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const expectedPath = path.join(__dirname, '..', 'public', 'meds-full.json');
const expectedBody = fs.readFileSync(expectedPath, 'utf8');
const expectedData = JSON.parse(expectedBody);
const expectedHash = crypto.createHash('sha256').update(expectedBody).digest('hex');
const baseUrl = (process.env.DEPLOY_URL || 'https://my-creations.github.io/dose-segura').replace(
  /\/$/,
  '',
);
const cacheBust = encodeURIComponent(process.env.GITHUB_SHA || Date.now().toString());
const attempts = Number(process.env.DEPLOY_VERIFY_ATTEMPTS || 18);
const delayMs = Number(process.env.DEPLOY_VERIFY_DELAY_MS || 10_000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchDeployedArtifact() {
  const url = `${baseUrl}/meds-full.json?deploy=${cacheBust}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }

  return response.text();
}

async function main() {
  console.log(
    `Expected Medication artifact: ${expectedData.lastUpdated}, ${Object.keys(expectedData.medications).length} medications, ${expectedHash}`,
  );

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const deployedBody = await fetchDeployedArtifact();
      const deployedHash = crypto.createHash('sha256').update(deployedBody).digest('hex');

      if (deployedBody === expectedBody) {
        console.log(`GitHub Pages verified on attempt ${attempt}: ${deployedHash}`);
        return;
      }

      const deployedData = JSON.parse(deployedBody);
      console.log(
        `Attempt ${attempt}/${attempts}: received ${deployedData.lastUpdated}, ${Object.keys(deployedData.medications).length} medications, ${deployedHash}; waiting for Pages propagation...`,
      );
    } catch (error) {
      console.log(`Attempt ${attempt}/${attempts}: ${error.message}`);
    }

    if (attempt < attempts) {
      await sleep(delayMs);
    }
  }

  throw new Error(`GitHub Pages did not match ${expectedHash} after ${attempts} attempts`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
