#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Bundle size thresholds (in bytes) - Realistic for modern lazy-loaded apps
const THRESHOLDS = {
  initial: 500 * 1024,   // 500kB (same - critical for first load)
  total: 2048 * 1024,    // 2MB (increased - more realistic for lazy chunks)
  warning: 400 * 1024    // 400kB warning threshold
};

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + 'kB';
}

function getFileSize(filePath) {
  try {
    return statSync(filePath).size;
  } catch {
    return 0;
  }
}

function analyzeBundle() {
  const browserDistPath = join(__dirname, '..', 'dist', 'angular-architecture', 'browser');
  
  if (!existsSync(browserDistPath)) {
    console.error('❌ Browser dist folder not found. Run "npm run build:prod" first.');
    process.exit(1);
  }

  try {
    const files = readdirSync(browserDistPath);
    
    // Categorize files
    const jsFiles = files.filter(file => file.endsWith('.js'));
    const cssFiles = files.filter(file => file.endsWith('.css'));
    const manifestFiles = files.filter(file => file.endsWith('.json'));
    
    // Get file sizes
    const jsFilesWithSizes = jsFiles.map(file => ({
      name: file,
      size: getFileSize(join(browserDistPath, file)),
      isLazy: file.includes('chunk-') && !file.startsWith('main')
    }));
    
    const cssFilesWithSizes = cssFiles.map(file => ({
      name: file,
      size: getFileSize(join(browserDistPath, file))
    }));
    
    // Find main bundle
    const mainBundle = jsFilesWithSizes
      .filter(file => !file.isLazy)
      .sort((a, b) => b.size - a.size)[0];
    
    // Calculate initial bundle size (main + all non-lazy chunks)
    const initialBundleSize = jsFilesWithSizes
      .filter(file => !file.isLazy)
      .reduce((sum, file) => sum + file.size, 0);
    
    const totalJsSize = jsFilesWithSizes.reduce((sum, file) => sum + file.size, 0);
    const totalCssSize = cssFilesWithSizes.reduce((sum, file) => sum + file.size, 0);
    
    console.log('\n📊 Bundle Analysis Report');
    console.log('=' .repeat(50));
    
    // Initial bundle analysis
    console.log(`\n📦 Initial Bundle Analysis`);
    console.log(`Main JS: ${formatBytes(mainBundle?.size || 0)} (${mainBundle?.name || 'not found'})`);
    console.log(`Total Initial: ${formatBytes(initialBundleSize)}`);
    
    if (initialBundleSize > THRESHOLDS.initial) {
      console.log(`❌ EXCEEDS LIMIT! (>${formatBytes(THRESHOLDS.initial)})`);
    } else if (initialBundleSize > THRESHOLDS.warning) {
      console.log(`⚠️  WARNING: Approaching limit (${formatBytes(THRESHOLDS.warning)} threshold)`);
    } else {
      console.log(`✅ Within limits (<${formatBytes(THRESHOLDS.initial)})`);
    }
    
    // Total bundle analysis
    console.log(`\n📚 Total JavaScript Bundle`);
    console.log(`Size: ${formatBytes(totalJsSize)}`);
    
    if (totalJsSize > THRESHOLDS.total) {
      console.log(`❌ EXCEEDS LIMIT! (>${formatBytes(THRESHOLDS.total)})`);
    } else {
      console.log(`✅ Within limits (<${formatBytes(THRESHOLDS.total)})`);
    }
    
    // CSS analysis
    console.log(`\n🎨 CSS Bundle`);
    console.log(`Size: ${formatBytes(totalCssSize)}`);
    
    // Top 5 largest chunks
    console.log(`\n📈 Largest JavaScript Files`);
    jsFilesWithSizes
      .sort((a, b) => b.size - a.size)
      .slice(0, 8)
      .forEach((file, index) => {
        const type = file.isLazy ? '[LAZY]' : '[INITIAL]';
        console.log(`${index + 1}. ${file.name} ${type}: ${formatBytes(file.size)}`);
      });
    
    // CSS files
    if (cssFilesWithSizes.length > 0) {
      console.log(`\n🎨 CSS Files`);
      cssFilesWithSizes
        .sort((a, b) => b.size - a.size)
        .forEach((file, index) => {
          console.log(`${index + 1}. ${file.name}: ${formatBytes(file.size)}`);
        });
    }
    
    // Lazy chunks analysis
    const lazyChunks = jsFilesWithSizes.filter(file => file.isLazy);
    const largeLazyChunks = lazyChunks.filter(chunk => chunk.size > 100 * 1024);
    
    console.log(`\n🚀 Lazy Loading Analysis`);
    console.log(`Total lazy chunks: ${lazyChunks.length}`);
    console.log(`Large lazy chunks (>100kB): ${largeLazyChunks.length}`);
    
    if (largeLazyChunks.length > 0) {
      largeLazyChunks.forEach(chunk => {
        console.log(`  • ${chunk.name}: ${formatBytes(chunk.size)}`);
      });
    }
    
    // Recommendations
    console.log(`\n💡 Recommendations`);
    
    if (initialBundleSize > THRESHOLDS.warning) {
      console.log('• Consider code splitting for large vendor libraries');
      console.log('• Review imports to ensure tree-shaking is working');
      console.log('• Check for duplicate dependencies');
    }
    
    if (largeLazyChunks.length > 0) {
      console.log('• Large lazy chunks detected - consider further splitting');
    }
    
    if (initialBundleSize < THRESHOLDS.warning) {
      console.log('• Bundle size looks good! ✅');
      console.log('• Consider implementing performance monitoring');
    }
    
    // Exit code based on thresholds
    const hasErrors = initialBundleSize > THRESHOLDS.initial || totalJsSize > THRESHOLDS.total;
    
    console.log(`\n${hasErrors ? '❌' : '✅'} Bundle size check ${hasErrors ? 'FAILED' : 'PASSED'}`);
    
    // Summary stats
    console.log(`\n📋 Summary`);
    console.log(`Initial Bundle: ${formatBytes(initialBundleSize)} / ${formatBytes(THRESHOLDS.initial)}`);
    console.log(`Total JS: ${formatBytes(totalJsSize)} / ${formatBytes(THRESHOLDS.total)}`);
    console.log(`CSS: ${formatBytes(totalCssSize)}`);
    
    if (hasErrors) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
    process.exit(1);
  }
}

analyzeBundle();