import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { vi } from 'vitest';
import { MultiStepFormStore, SubmitResult } from './multi-step-form.store';
import { StepConfig } from '../models/step.model';

const STEP_CONFIGS: StepConfig[] = [
  { path: 'step-1', titleKey: 'wizard.demo.steps.step1', index: 0 },
  { path: 'step-2', titleKey: 'wizard.demo.steps.step2', index: 1 },
  { path: 'step-3', titleKey: 'wizard.demo.steps.step3', index: 2 },
];

describe('MultiStepFormStore', () => {
  let store: MultiStepFormStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()]
    });
    store = new MultiStepFormStore();
  });

  describe('Initial state', () => {
    it('should have empty steps before initialization', () => {
      expect(store.steps()).toHaveLength(0);
    });

    it('should not be initialized before calling initialize()', () => {
      expect(store.isInitialized()).toBe(false);
    });

    it('should have no current step before init', () => {
      expect(store.currentStep()).toBeNull();
    });

    it('should have 0 progress percent before init', () => {
      expect(store.progressPercent()).toBe(0);
    });
  });

  describe('initialize()', () => {
    it('should create StepMeta from configs', () => {
      store.initialize(STEP_CONFIGS);
      const steps = store.steps();
      expect(steps).toHaveLength(3);
    });

    it('should set first step as current and accessible', () => {
      store.initialize(STEP_CONFIGS);
      const steps = store.steps();
      expect(steps[0].isCurrent).toBe(true);
      expect(steps[0].isAccessible).toBe(true);
    });

    it('should set subsequent steps as not accessible', () => {
      store.initialize(STEP_CONFIGS);
      const steps = store.steps();
      expect(steps[1].isAccessible).toBe(false);
      expect(steps[2].isAccessible).toBe(false);
    });

    it('should reset currentStepIndex to 0', () => {
      store.initialize(STEP_CONFIGS);
      expect(store.currentStepIndex()).toBe(0);
    });

    it('should mark isInitialized as true', () => {
      store.initialize(STEP_CONFIGS);
      expect(store.isInitialized()).toBe(true);
    });

    it('should not reset formData on re-initialization (formData persists)', () => {
      store.initialize(STEP_CONFIGS);
      store.updateStepData({ key: 'value' } as Record<string, unknown>);
      store.initialize(STEP_CONFIGS);
      // initialize() does not clear formData; use reset() to clear it
      expect(store.steps()).toHaveLength(3);
    });

    it('should clear submitResult on re-initialization', () => {
      store.initialize(STEP_CONFIGS);
      const result: SubmitResult = { success: true, timestamp: Date.now() };
      store.setSubmitResult(result);
      store.initialize(STEP_CONFIGS);
      expect(store.submitResult()).toBeNull();
    });
  });

  describe('setCurrentStepFromPath()', () => {
    beforeEach(() => store.initialize(STEP_CONFIGS));

    it('should do nothing if path not found', () => {
      store.setCurrentStepFromPath('unknown');
      expect(store.currentStepIndex()).toBe(0);
    });

    it('should do nothing if path matches current step', () => {
      store.setCurrentStepFromPath('step-1');
      expect(store.currentStepIndex()).toBe(0);
    });

    it('should update currentStepIndex when path found', () => {
      // Make step 1 accessible first
      store.completeCurrentStep();
      store.setCurrentStepFromPath('step-2');
      expect(store.currentStepIndex()).toBe(1);
    });

    it('should update isCurrent flags', () => {
      store.completeCurrentStep();
      store.setCurrentStepFromPath('step-2');
      const steps = store.steps();
      expect(steps[0].isCurrent).toBe(false);
      expect(steps[1].isCurrent).toBe(true);
    });

    it('should reset isCurrentStepValid on step change', () => {
      store.setCurrentStepValid(true);
      store.completeCurrentStep();
      store.setCurrentStepFromPath('step-2');
      expect(store.isCurrentStepValid()).toBe(false);
    });
  });

  describe('setCurrentStepValid()', () => {
    it('should update isCurrentStepValid signal', () => {
      store.initialize(STEP_CONFIGS);
      store.setCurrentStepValid(true);
      expect(store.isCurrentStepValid()).toBe(true);
    });

    it('canGoNext should reflect step validity', () => {
      store.initialize(STEP_CONFIGS);
      expect(store.canGoNext()).toBe(false);
      store.setCurrentStepValid(true);
      expect(store.canGoNext()).toBe(true);
    });
  });

  describe('setDirty()', () => {
    beforeEach(() => {
      store.initialize(STEP_CONFIGS);
      // Complete step 0, then step 1
      store.setCurrentStepValid(true);
      store.completeCurrentStep();
      store.setCurrentStepFromPath('step-2');
      store.setCurrentStepValid(true);
      store.completeCurrentStep();
      store.setCurrentStepFromPath('step-3');
    });

    it('should mark current and future steps as not completed when dirty', () => {
      store.setCurrentStepFromPath('step-1');
      store.setDirty(true);
      const steps = store.steps();
      expect(steps[0].isCompleted).toBe(false);
    });

    it('should recompute step accessibility when dirty', () => {
      store.setCurrentStepFromPath('step-1');
      store.setDirty(true);
      const steps = store.steps();
      // step 1 is accessible (it IS current), step 2 is now inaccessible
      expect(steps[1].isAccessible).toBe(false);
    });
  });

  describe('updateStepData()', () => {
    it('should merge data with existing formData', () => {
      store.initialize(STEP_CONFIGS);
      store.updateStepData({ name: 'Alice' } as Record<string, unknown>);
      store.updateStepData({ age: 30 } as Record<string, unknown>);
      const data = store.formData();
      expect(data['name']).toBe('Alice');
      expect(data['age']).toBe(30);
    });
  });

  describe('completeCurrentStep()', () => {
    beforeEach(() => store.initialize(STEP_CONFIGS));

    it('should mark current step as completed', () => {
      store.completeCurrentStep();
      expect(store.steps()[0].isCompleted).toBe(true);
    });

    it('should unlock the next step', () => {
      store.completeCurrentStep();
      expect(store.steps()[1].isAccessible).toBe(true);
    });

    it('should update formData if data provided', () => {
      store.completeCurrentStep({ hobby: 'coding' } as Record<string, unknown>);
      expect(store.formData()['hobby']).toBe('coding');
    });

    it('should merge data rather than replace', () => {
      store.updateStepData({ name: 'Bob' } as Record<string, unknown>);
      store.completeCurrentStep({ age: 25 } as Record<string, unknown>);
      expect(store.formData()['name']).toBe('Bob');
      expect(store.formData()['age']).toBe(25);
    });
  });

  describe('canGoPrev', () => {
    it('should be false on first step', () => {
      store.initialize(STEP_CONFIGS);
      expect(store.canGoPrev()).toBe(false);
    });

    it('should be true when on any step > 0', () => {
      store.initialize(STEP_CONFIGS);
      store.completeCurrentStep();
      store.setCurrentStepFromPath('step-2');
      expect(store.canGoPrev()).toBe(true);
    });
  });

  describe('isLastStep', () => {
    it('should be false on first step', () => {
      store.initialize(STEP_CONFIGS);
      expect(store.isLastStep()).toBe(false);
    });

    it('should be true on last step', () => {
      store.initialize(STEP_CONFIGS);
      store.completeCurrentStep();
      store.setCurrentStepFromPath('step-2');
      store.completeCurrentStep();
      store.setCurrentStepFromPath('step-3');
      expect(store.isLastStep()).toBe(true);
    });
  });

  describe('progressPercent', () => {
    it('should return 0 with no steps completed', () => {
      store.initialize(STEP_CONFIGS);
      expect(store.progressPercent()).toBe(0);
    });

    it('should increase as steps are completed', () => {
      store.initialize(STEP_CONFIGS);
      store.completeCurrentStep();
      expect(store.progressPercent()).toBeGreaterThan(0);
    });

    it('should be 100 when all steps completed sequentially', () => {
      store.initialize(STEP_CONFIGS);
      // Complete each step sequentially
      store.completeCurrentStep();
      store.setCurrentStepFromPath('step-2');
      store.completeCurrentStep();
      store.setCurrentStepFromPath('step-3');
      store.completeCurrentStep();
      expect(store.progressPercent()).toBe(100);
    });
  });

  describe('setSubmitResult()', () => {
    it('should store submit result', () => {
      store.initialize(STEP_CONFIGS);
      const result: SubmitResult = { success: true, transactionId: 'TXN-123', timestamp: 1000 };
      store.setSubmitResult(result);
      expect(store.submitResult()).toEqual(result);
    });
  });

  describe('reset()', () => {
    it('should reset all state and keep steps structure', () => {
      store.initialize(STEP_CONFIGS);
      store.setCurrentStepValid(true);
      store.completeCurrentStep();
      store.updateStepData({ name: 'Test' } as Record<string, unknown>);
      store.setSubmitResult({ success: true, timestamp: Date.now() });
      store.reset();

      expect(store.steps()).toHaveLength(3);
      expect(store.steps()[0].isCompleted).toBe(false);
      expect(store.steps()[0].isCurrent).toBe(true);
      expect(store.steps()[0].isAccessible).toBe(true);
      expect(store.steps()[1].isAccessible).toBe(false);
      expect(store.formData()).toEqual({});
      expect(store.submitResult()).toBeNull();
      expect(store.currentStepIndex()).toBe(0);
    });
  });
});
