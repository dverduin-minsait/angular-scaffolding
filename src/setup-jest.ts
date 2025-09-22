import '@testing-library/jest-dom';
import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';
import { accessibilityMatchers } from './app/testing/accessibility-test-utils';

setupZonelessTestEnv();

// Extend Jest with custom accessibility matchers
expect.extend(accessibilityMatchers);