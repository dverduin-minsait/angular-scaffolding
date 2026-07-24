import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MULTI_STEP_FORM_CONFIG, MULTI_STEP_FORM_STORE } from '../tokens/multi-step-form.tokens';

function getBaseUrl(fullUrl: string): string {
  const urlWithoutParams = fullUrl.split('?')[0];
  const parts = urlWithoutParams.split('/');
  parts.pop();
  return parts.join('/');
}

/**
 * Prevents forward navigation to a step unless all previous steps are completed.
 * Place as canActivateChild on the parent wizard route.
 *
 * Navigation to step N is allowed when:
 * - N === 0 (first step is always accessible)
 * - steps[0..N-1].every(s => s.isCompleted)
 */
export const stepNavigationGuard: CanActivateFn = (route, state) => {
  const store = inject(MULTI_STEP_FORM_STORE, { optional: true });
  const config = inject(MULTI_STEP_FORM_CONFIG, { optional: true });
  const router = inject(Router);

  if (!store || !config || config.length === 0) return true;

  const stepIndex = route.data['stepIndex'] as number | undefined;
  if (stepIndex === undefined || stepIndex === 0) return true;

  const steps = store.steps();
  const baseUrl = getBaseUrl(state.url);

  // Store not yet initialized (shell ngOnInit hasn't run yet on first load)
  if (steps.length === 0) {
    return router.parseUrl(`${baseUrl}/${config[0].path}`);
  }

  // Check all previous steps are completed
  for (let i = 0; i < stepIndex; i++) {
    if (!steps[i]?.isCompleted) {
      const firstIncomplete = steps.find(s => !s.isCompleted);
      const redirectPath = firstIncomplete?.path ?? config[0].path;
      return router.parseUrl(`${baseUrl}/${redirectPath}`);
    }
  }

  return true;
};
