#!/usr/bin/env node

/**
 * Bundle Size Monitoring Configuration
 * 
 * This file defines thresholds and monitoring rules for the Angular application bundle.
 * Used by bundle-size-check.mjs and CI pipeline.
 */

export const BUNDLE_THRESHOLDS = {
  // Initial bundle (critical for first load performance)
  initial: {
    warning: 400 * 1024,  // 400kB warning
    error: 500 * 1024     // 500kB error (hard limit)
  },
  
  // Total JavaScript bundle (all chunks combined) - more realistic for modern apps
  totalJs: {
    warning: 2048 * 1024, // 2MB warning (increased for lazy chunks)
    error: 3072 * 1024    // 3MB error (more realistic with vendor libraries)
  },
  
  // CSS bundle
  css: {
    warning: 100 * 1024,  // 100kB warning
    error: 150 * 1024     // 150kB error
  },
  
  // Individual lazy chunk limits
  lazyChunk: {
    warning: 500 * 1024,  // 500kB warning for single lazy chunk
    error: 1024 * 1024    // 1MB error for single lazy chunk (AG Grid can be large)
  }
};

export const MONITORING_CONFIG = {
  // Files to track individually
  criticalFiles: [
    'main-*.js',
    'styles-*.css',
    'polyfills-*.js'
  ],
  
  // Chunk size progression monitoring
  trackProgression: true,
  
  // Enable detailed analysis
  enableRecommendations: true,
  
  // CI mode settings
  ci: {
    failOnError: true,
    generateReport: true,
    outputFormat: 'json', // 'console' | 'json' | 'html'
    reportPath: './bundle-report.json'
  }
};

export const PERFORMANCE_BUDGETS = {
  // Based on Angular CLI budgets but more realistic
  development: {
    initial: 2048 * 1024, // 2MB for dev builds
    totalJs: 4096 * 1024  // 4MB for dev builds
  },
  
  production: BUNDLE_THRESHOLDS
};