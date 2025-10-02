import '@testing-library/jest-dom';
import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';
import { accessibilityMatchers } from './app/testing/accessibility-test-utils';

setupZonelessTestEnv();

// Extend Jest with custom accessibility matchers
expect.extend(accessibilityMatchers);

// Suppress noisy jsdom CSS parse errors (e.g., from @layer rules Angular CDK injects)
// We only filter the specific, known benign pattern to avoid masking real issues.
const originalConsoleError = console.error;
const SUPPRESSED_ERROR_PATTERNS = [
	/Could not parse CSS stylesheet/, // Primary jsdom style parse error
	/css parsing/i
];

// Use a flag to allow opting-out if debugging is needed: set SUPPRESS_CSS_PARSE_LOGS=false
const shouldSuppress = ((process.env as Record<string, string | undefined>)["SUPPRESS_CSS_PARSE_LOGS"] ?? 'true') !== 'false';

if (shouldSuppress) {
	// eslint-disable-next-line no-console
	console.error = (...args: any[]) => {
		const first = args[0];
		const message = first instanceof Error ? first.message : String(first);
		if (SUPPRESSED_ERROR_PATTERNS.some(r => r.test(message))) {
			return; // swallow benign style parse noise
		}
		originalConsoleError(...args);
	};
}

// Provide global TranslateModule for tests (used by TranslationService)
