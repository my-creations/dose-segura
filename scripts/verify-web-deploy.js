#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const expectedPath = path.join(__dirname, '..', 'public', 'meds-full.json');
const expectedBody = fs.readFileSync(expectedPath, 'utf8');
const expectedData = JSON.parse(expectedBody);
const expectedHash = crypto.createHash('sha256').update(expectedBody).digest('hex');

/**
 * Fingerprint of the built app: the hashed bundle URLs in index.html. meds-full.json alone is
 * not enough — it is unchanged by most releases, so a stale CDN or a partial publish would
 * still "verify" successfully. Bundle hashes change on every code change.
 */
const distDir = path.join(__dirname, '..', 'dist');
const localIndex = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const expectedBundles = extractBundles(localIndex);
const expectedSitemapUrls = (
  fs.readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8').match(/<loc>/g) || []
).length;

function extractBundles(html) {
  const matches = html.match(/_expo\/static\/js\/[^"']+\.js/g) || [];
  return [...new Set(matches)].sort();
}

const baseUrl = (process.env.DEPLOY_URL || 'https://my-creations.github.io/dose-segura').replace(
  /\/$/,
  '',
);
const cacheBust = encodeURIComponent(process.env.GITHUB_SHA || Date.now().toString());
const attempts = Number(process.env.DEPLOY_VERIFY_ATTEMPTS || 18);
const delayMs = Number(process.env.DEPLOY_VERIFY_DELAY_MS || 10_000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchArtifact(artifact) {
  const url = `${baseUrl}/${artifact}?deploy=${cacheBust}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }

  return response.text();
}

async function fetchDeployedArtifact() {
  return fetchArtifact('meds-full.json');
}

function describeDeployed(deployedBody, deployedIndex, deployedSitemapUrls) {
  const deployedData = JSON.parse(deployedBody);
  return `${deployedData.lastUpdated}, ${Object.keys(deployedData.medications).length} medications, bundles=${extractBundles(deployedIndex).length}, sitemap=${deployedSitemapUrls} urls`;
}

async function main() {
  if (expectedBundles.length === 0) {
    throw new Error('No hashed bundles found in dist/index.html — run bun run build:web first');
  }

  console.log(
    `Expected: ${expectedData.lastUpdated}, ${Object.keys(expectedData.medications).length} medications, ${expectedHash.slice(0, 12)}…, ${expectedBundles.length} bundles, ${expectedSitemapUrls} sitemap URLs`,
  );

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const deployedBody = await fetchDeployedArtifact();
      const deployedHash = crypto.createHash('sha256').update(deployedBody).digest('hex');
      const deployedIndex = await fetchArtifact('index.html');
      const deployedBundles = extractBundles(deployedIndex);
      const deployedSitemapUrls = ((await fetchArtifact('sitemap.xml')).match(/<loc>/g) || [])
        .length;

      const problems = [];
      if (deployedBody !== expectedBody) {
        problems.push(
          `meds-full.json hash ${deployedHash.slice(0, 12)}… != ${expectedHash.slice(0, 12)}…`,
        );
      }
      if (deployedBundles.join() !== expectedBundles.join()) {
        problems.push(
          `bundles [${deployedBundles.map((b) => b.split('/').pop()).join(', ')}] != [${expectedBundles.map((b) => b.split('/').pop()).join(', ')}]`,
        );
      }
      if (deployedSitemapUrls !== expectedSitemapUrls) {
        problems.push(`sitemap ${deployedSitemapUrls} URLs != ${expectedSitemapUrls}`);
      }

      if (problems.length === 0) {
        console.log(`GitHub Pages verified on attempt ${attempt}: ${expectedHash.slice(0, 12)}…`);
        return;
      }

      console.log(
        `Attempt ${attempt}/${attempts}: ${describeDeployed(deployedBody, deployedIndex, deployedSitemapUrls)}; waiting for Pages propagation — ${problems.join('; ')}`,
      );
    } catch (error) {
      console.log(`Attempt ${attempt}/${attempts}: ${error.message}`);
    }

    if (attempt < attempts) {
      await sleep(delayMs);
    }
  }

  throw new Error(
    `GitHub Pages did not match the build after ${attempts} attempts (expected ${expectedHash.slice(0, 12)}…, ${expectedBundles.length} bundles, ${expectedSitemapUrls} sitemap URLs)`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
