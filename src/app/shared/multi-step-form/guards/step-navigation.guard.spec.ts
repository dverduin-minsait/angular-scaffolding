import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideZonelessChangeDetection, Injector, signal } from '@angular/core';
import { runInInjectionContext } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { vi } from 'vitest';
import { stepNavigationGuard } from './step-navigation.guard';
import { MULTI_STEP_FORM_CONFIG, MULTI_STEP_FORM_STORE } from '../tokens/multi-step-form.tokens';
import { StepConfig, StepMeta } from '../models/step.model';

const CONFIGS: StepConfig[] = [
  { path: 'step-1', titleKey: 'step1', index: 0 },
  { path: 'step-2', titleKey: 'step2', index: 1 },
  { path: 'step-3', titleKey: 'step3', index: 2 },
];

function makeSteps(completedIndices: number[] = []): StepMeta[] {
  return CONFIGS.map((c, i) => ({
    ...c,
    isCompleted: completedIndices.includes(i),
    isCurrent: false,
    isAccessible: i === 0 || completedIndices.includes(i - 1),
  }));
}

function makeRoute(stepIndex: number | undefined, path: string): ActivatedRouteSnapshot {
  return {
    data: stepIndex !== undefined ? { stepIndex } : {},
    url: path.split('/').map(p => ({ path: p })),
  } as unknown as ActivatedRouteSnapshot;
}

function makeState(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
}

describe('stepNavigationGuard', () => {
  let injector: Injector;
  let router: { parseUrl: ReturnType<typeof vi.fn>; navigate: ReturnType<typeof vi.fn> };

  const mockParseUrl = vi.fn((path: string) => ({ __url: path }) as unknown as UrlTree);

  const runGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
    runInInjectionContext(injector, () => stepNavigationGuard(route, state));

  describe('without store/config providers', () => {
    beforeEach(async () => {
      router = { parseUrl: mockParseUrl, navigate: vi.fn() };
      await TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: Router, useValue: router },
        ]
      }).compileComponents();
      injector = TestBed.inject(Injector);
    });

    it('should return true when no store is provided', () => {
      const result = runGuard(makeRoute(1, '/wizard/step-2'), makeState('/wizard/step-2'));
      expect(result).toBe(true);
    });
  });

  describe('with store and config providers', () => {
    let stepsSignal: ReturnType<typeof signal<StepMeta[]>>;

    function setupTestBed(steps: StepMeta[]) {
      stepsSignal = signal(steps);
      const mockStore = {
        steps: stepsSignal.asReadonly(),
      };

      return TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          { provide: Router, useValue: { parseUrl: mockParseUrl } },
          { provide: MULTI_STEP_FORM_STORE, useValue: mockStore },
          { provide: MULTI_STEP_FORM_CONFIG, useValue: CONFIGS },
        ]
      }).compileComponents();
    }

    describe('step index === 0 (first step)', () => {
      beforeEach(async () => {
        await setupTestBed(makeSteps());
        injector = TestBed.inject(Injector);
      });

      it('should always allow access to first step', () => {
        const result = runGuard(makeRoute(0, '/wizard/step-1'), makeState('/wizard/step-1'));
        expect(result).toBe(true);
      });
    });

    describe('step index undefined (parent route)', () => {
      beforeEach(async () => {
        await setupTestBed(makeSteps());
        injector = TestBed.inject(Injector);
      });

      it('should allow access when stepIndex is not defined in route data', () => {
        const result = runGuard(makeRoute(undefined, '/wizard'), makeState('/wizard'));
        expect(result).toBe(true);
      });
    });

    describe('store not yet initialized (empty steps)', () => {
      beforeEach(async () => {
        await setupTestBed([]);
        injector = TestBed.inject(Injector);
        vi.clearAllMocks();
      });

      it('should redirect to first config path when steps are empty', () => {
        const result = runGuard(makeRoute(1, '/wizard/step-2'), makeState('/wizard/step-2'));
        expect(result).not.toBe(true);
        expect(mockParseUrl).toHaveBeenCalledWith('/wizard/step-1');
      });
    });

    describe('step 1 with step 0 NOT completed', () => {
      beforeEach(async () => {
        await setupTestBed(makeSteps([]));
        injector = TestBed.inject(Injector);
        vi.clearAllMocks();
      });

      it('should redirect to first incomplete step', () => {
        const result = runGuard(makeRoute(1, '/wizard/step-2'), makeState('/wizard/step-2'));
        expect(result).not.toBe(true);
        // Should redirect back to step-1 (first incomplete)
        expect(mockParseUrl).toHaveBeenCalled();
      });
    });

    describe('step 1 with step 0 completed', () => {
      beforeEach(async () => {
        await setupTestBed(makeSteps([0]));
        injector = TestBed.inject(Injector);
      });

      it('should allow access when previous step is completed', () => {
        const result = runGuard(makeRoute(1, '/wizard/step-2'), makeState('/wizard/step-2'));
        expect(result).toBe(true);
      });
    });

    describe('step 2 with only step 0 completed', () => {
      beforeEach(async () => {
        await setupTestBed(makeSteps([0]));
        injector = TestBed.inject(Injector);
        vi.clearAllMocks();
      });

      it('should redirect because step 1 is not completed', () => {
        const result = runGuard(makeRoute(2, '/wizard/step-3'), makeState('/wizard/step-3'));
        expect(result).not.toBe(true);
        expect(mockParseUrl).toHaveBeenCalled();
      });
    });

    describe('step 2 with steps 0 and 1 completed', () => {
      beforeEach(async () => {
        await setupTestBed(makeSteps([0, 1]));
        injector = TestBed.inject(Injector);
      });

      it('should allow access when all previous steps are completed', () => {
        const result = runGuard(makeRoute(2, '/wizard/step-3'), makeState('/wizard/step-3'));
        expect(result).toBe(true);
      });
    });
  });
});
