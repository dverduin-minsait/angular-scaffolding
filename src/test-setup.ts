import '@testing-library/jest-dom/vitest';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { toHaveNoViolations } from 'vitest-axe/dist/matchers';
import { accessibilityMatchers } from './app/testing/accessibility-test-utils';

// Avoid noisy baseline-browser-mapping warnings during test runs.
// (The library documents these env vars as the supported suppression mechanism.)
(process.env as Record<string, string | undefined>)['BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA'] ??= 'true';
(process.env as Record<string, string | undefined>)['BROWSERSLIST_IGNORE_OLD_DATA'] ??= 'true';

setupTestBed({ zoneless: true });

// jsdom does not implement canvas APIs by default; some components/libraries
// attempt to call getContext() during render.
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: () => ({})
});

expect.extend(accessibilityMatchers);
expect.extend({ toHaveNoViolations } as never);

// Suppress noisy jsdom CSS parse errors (e.g., from @layer rules Angular CDK injects)
// We only filter the specific, known benign pattern to avoid masking real issues.
const originalConsoleError = console.error;
const SUPPRESSED_ERROR_PATTERNS = [
  /Could not parse CSS stylesheet/,
  /css parsing/i
];

// Control CSS parse logging via env (tests default to suppressing these errors):
// - Preferred (explicit): set ENABLE_CSS_PARSE_LOGS=true to see the raw jsdom CSS parse errors.
// - Legacy / double-negative (backwards-compat): historically, suppression was "on by default";
//   set SUPPRESS_CSS_PARSE_LOGS=false to disable suppression and show the errors.
const env = process.env as Record<string, string | undefined>;
const enableCssParseLogs =
  env['ENABLE_CSS_PARSE_LOGS'] === 'true' ||
  env['SUPPRESS_CSS_PARSE_LOGS'] === 'false';

const shouldSuppress = !enableCssParseLogs;
if (shouldSuppress) {
  console.error = (...args: unknown[]) => {
    const first = args[0];
    const message = first instanceof Error ? first.message : String(first);
    if (SUPPRESSED_ERROR_PATTERNS.some(r => r.test(message))) {
      return;
    }
    originalConsoleError(...args);
  };
}
