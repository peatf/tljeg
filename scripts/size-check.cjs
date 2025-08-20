const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

const distDir = path.join(__dirname, '../dist');
const statsFile = path.join(distDir, 'stats.html');

// Size thresholds (in bytes)
const THRESHOLDS = {
  mainEntry: 250 * 1024, // 250KB gzipped
  totalJS: 1 * 1024 * 1024, // 1MB gzipped
  totalAssets: 50 * 1024 * 1024 // 50MB total (including ML models)
};

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function getGzippedSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = gzipSync(content);
  return gzipped.length;
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else {
    return `${bytes} B`;
  }
}

function analyzeBundle() {
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist directory not found. Run npm run build first.');
    process.exit(1);
  }

  console.log('🔍 Analyzing bundle sizes...\n');

  const files = fs.readdirSync(distDir, { recursive: true });
  let totalSize = 0;
  let totalJSSize = 0;
  let mainEntrySize = 0;
  
  const jsFiles = [];
  const cssFiles = [];
  const otherFiles = [];

  files.forEach(file => {
    if (typeof file !== 'string') return;
    
    const filePath = path.join(distDir, file);
    if (!fs.lstatSync(filePath).isFile()) return;

    const size = getFileSize(filePath);
    totalSize += size;

    if (file.endsWith('.js')) {
      const gzipSize = getGzippedSize(filePath);
      totalJSSize += gzipSize;
      
      jsFiles.push({
        name: file,
        size: size,
        gzipSize: gzipSize
      });

      // Consider the largest JS file as main entry
      if (gzipSize > mainEntrySize) {
        mainEntrySize = gzipSize;
      }
    } else if (file.endsWith('.css')) {
      cssFiles.push({
        name: file,
        size: size,
        gzipSize: getGzippedSize(filePath)
      });
    } else {
      otherFiles.push({
        name: file,
        size: size
      });
    }
  });

  // Sort by size (largest first)
  jsFiles.sort((a, b) => b.gzipSize - a.gzipSize);
  cssFiles.sort((a, b) => b.gzipSize - a.gzipSize);
  otherFiles.sort((a, b) => b.size - a.size);

  console.log('📊 Bundle Analysis Results:');
  console.log('=' .repeat(50));
  
  console.log('\n📦 JavaScript Files (gzipped):');
  jsFiles.forEach(file => {
    console.log(`  ${file.name}: ${formatSize(file.gzipSize)} (${formatSize(file.size)} raw)`);
  });

  console.log('\n🎨 CSS Files (gzipped):');
  cssFiles.forEach(file => {
    console.log(`  ${file.name}: ${formatSize(file.gzipSize)}`);
  });

  console.log('\n📄 Other Assets:');
  otherFiles.slice(0, 10).forEach(file => {
    console.log(`  ${file.name}: ${formatSize(file.size)}`);
  });
  if (otherFiles.length > 10) {
    console.log(`  ... and ${otherFiles.length - 10} more files`);
  }

  console.log('\n📈 Summary:');
  console.log(`  Main Entry (largest JS): ${formatSize(mainEntrySize)}`);
  console.log(`  Total JS (gzipped): ${formatSize(totalJSSize)}`);
  console.log(`  Total Assets: ${formatSize(totalSize)}`);

  // Check thresholds
  let failed = false;
  
  console.log('\n🎯 Threshold Check:');
  if (mainEntrySize > THRESHOLDS.mainEntry) {
    console.log(`  ❌ Main entry exceeds threshold: ${formatSize(mainEntrySize)} > ${formatSize(THRESHOLDS.mainEntry)}`);
    failed = true;
  } else {
    console.log(`  ✅ Main entry within threshold: ${formatSize(mainEntrySize)}`);
  }

  if (totalJSSize > THRESHOLDS.totalJS) {
    console.log(`  ❌ Total JS exceeds threshold: ${formatSize(totalJSSize)} > ${formatSize(THRESHOLDS.totalJS)}`);
    failed = true;
  } else {
    console.log(`  ✅ Total JS within threshold: ${formatSize(totalJSSize)}`);
  }

  if (totalSize > THRESHOLDS.totalAssets) {
    console.log(`  ❌ Total assets exceed threshold: ${formatSize(totalSize)} > ${formatSize(THRESHOLDS.totalAssets)}`);
    failed = true;
  } else {
    console.log(`  ✅ Total assets within threshold: ${formatSize(totalSize)}`);
  }

  if (fs.existsSync(statsFile)) {
    console.log(`\n📊 Bundle analyzer report available at: dist/stats.html`);
  }

  if (failed) {
    console.log('\n❌ Size check failed! Consider optimizing large files or adjusting thresholds.');
    process.exit(1);
  } else {
    console.log('\n✅ All size checks passed!');
  }
}

analyzeBundle();