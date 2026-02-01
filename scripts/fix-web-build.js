const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const NODE_MODULES_DIR = path.join(ASSETS_DIR, 'node_modules');
const LIBS_DIR = path.join(ASSETS_DIR, 'libs');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles || [];
  
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

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
    publicFiles.forEach(file => {
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
  const files = getAllFiles(DIST_DIR);
  let updateCount = 0;

  files.forEach(filePath => {
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

  console.log(`✅ Fixed references in ${updateCount} files.`);
  console.log('✨ Web build fix complete!');
}

fixWebBuild();