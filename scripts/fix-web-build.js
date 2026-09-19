#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { collectFiles } = require('./utils/fs-utils');
const { generateServiceWorker } = require('./generate-sw-precache');
const { generateRouteMeta } = require('./generate-route-meta');
const { generateSitemap } = require('./generate-sitemap');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const NODE_MODULES_DIR = path.join(ASSETS_DIR, 'node_modules');
const LIBS_DIR = path.join(ASSETS_DIR, 'libs');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const NOT_FOUND_HTML_PATH = path.join(DIST_DIR, '404.html');
const NOJEKYLL_PATH = path.join(DIST_DIR, '.nojekyll');

function fixWebBuild() {
  console.log('🔧 Starting web build fix...');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ dist directory not found. Run build:web first.');
    process.exit(1);
  }

  // Copy public folder contents to dist
  if (fs.existsSync(PUBLIC_DIR)) {
    console.log('📂 Copying public directory contents to dist...');
    const publicFiles = fs.readdirSync(PUBLIC_DIR);
    publicFiles.forEach((file) => {
      const srcPath = path.join(PUBLIC_DIR, file);
      const destPath = path.join(DIST_DIR, file);
      fs.cpSync(srcPath, destPath, { recursive: true });
    });
  }

  // 1. Rename assets/node_modules to assets/libs
  // This bypasses issues where git or GitHub Pages ignores node_modules folders
  if (fs.existsSync(NODE_MODULES_DIR)) {
    console.log('📦 Renaming assets/node_modules to assets/libs...');
    if (fs.existsSync(LIBS_DIR)) {
      fs.rmSync(LIBS_DIR, { recursive: true, force: true });
    }
    fs.renameSync(NODE_MODULES_DIR, LIBS_DIR);
  } else if (fs.existsSync(LIBS_DIR)) {
    console.log('ℹ️ assets/node_modules already renamed to assets/libs');
  } else {
    console.log('⚠️ assets/node_modules not found in assets dir. Skipping rename.');
  }

  // 2. Update references in all files
  console.log('📝 Updating references in build files...');
  const files = collectFiles(DIST_DIR);
  let updateCount = 0;

  files.forEach((filePath) => {
    // Only process text files that might contain references
    if (!/\.(html|js|css|json|map)$/.test(filePath)) return;

    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Replace "assets/node_modules" with "assets/libs"
      // This regex captures the string literal usage in JS and URL paths in HTML/CSS
      const newContent = content.replace(/assets\/node_modules/g, 'assets/libs');

      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        updateCount++;
      }
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err);
    }
  });

  // 3. Make the export directly deployable to GitHub Pages
  if (fs.existsSync(INDEX_HTML_PATH)) {
    console.log('📄 Ensuring 404.html exists for GitHub Pages SPA fallback...');
    fs.copyFileSync(INDEX_HTML_PATH, NOT_FOUND_HTML_PATH);
  }

  console.log('🪧 Ensuring .nojekyll exists for GitHub Pages asset serving...');
  fs.writeFileSync(NOJEKYLL_PATH, '', 'utf8');

  console.log(`✅ Fixed references in ${updateCount} files.`);

  // 4. The literal `[id].html` shells are export artifacts, never requested by a real URL.
  for (const artifact of ['medication/[id].html', 'procedure/[id].html']) {
    const artifactPath = path.join(DIST_DIR, artifact);
    if (fs.existsSync(artifactPath)) {
      fs.rmSync(artifactPath);
    }
  }

  // 5. Per-route SEO tags and the sitemap. Must run after 404.html exists (it is a copy of
  // index.html, so it would otherwise inherit the home page's title and canonical) and after
  // public/ has been copied (the sitemap is generated, not hand-maintained).
  generateRouteMeta({ distDir: DIST_DIR });
  generateSitemap({ distDir: DIST_DIR });

  // 6. Final SW precache after hashed + libs paths and HTML content are stable
  generateServiceWorker({ distDir: DIST_DIR });

  console.log('✨ Web build fix complete!');
}

if (require.main === module) {
  try {
    fixWebBuild();
  } catch (err) {
    console.error('Error during web build fix:', err);
    process.exit(1);
  }
}

module.exports = { fixWebBuild };
