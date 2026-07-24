import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';
import { MultiStepFormShellComponent } from './multi-step-form-shell.component';
import { MULTI_STEP_FORM_CONFIG, MULTI_STEP_FORM_STORE } from '../../tokens/multi-step-form.tokens';
import { StepConfig, StepMeta } from '../../models/step.model';
import { SubmitResult } from '../../store/multi-step-form.store';
import { provideStubTranslationService } from '../../../../testing/i18n-testing';

@Component({ template: '<p>Step Content</p>' })
class MockStepComponent {}

const STEP_CONFIGS: StepConfig[] = [
  { path: 'step-1', titleKey: 'wizard.demo.steps.step1', index: 0 },
  { path: 'step-2', titleKey: 'wizard.demo.steps.step2', index: 1 },
  { path: 'step-3', titleKey: 'wizard.demo.steps.step3', index: 2 },
];

const MOCK_STEPS: StepMeta[] = [
  { ...STEP_CONFIGS[0], isCompleted: false, isCurrent: true, isAccessible: true },
  { ...STEP_CONFIGS[1], isCompleted: false, isCurrent: false, isAccessible: false },
  { ...STEP_CONFIGS[2], isCompleted: false, isCurrent: false, isAccessible: false },
];

function buildMockStore(overrides: Partial<Record<string, unknown>> = {}) {
  const stepsSignal = signal<StepMeta[]>(MOCK_STEPS);
  const submitResultSignal = signal<SubmitResult | null>(null);
  const currentStepIndexSignal = signal(0);
  const canGoNextSignal = signal(false);
  const canGoPrevSignal = signal(false);
  const isLastStepSignal = signal(false);
  const progressPercentSignal = signal(0);
  const isCurrentStepValidSignal = signal(false);

  return {
    steps: stepsSignal.asReadonly(),
    submitResult: submitResultSignal.asReadonly(),
    currentStepIndex: currentStepIndexSignal.asReadonly(),
    canGoNext: canGoNextSignal.asReadonly(),
    canGoPrev: canGoPrevSignal.asReadonly(),
    isLastStep: isLastStepSignal.asReadonly(),
    progressPercent: progressPercentSignal.asReadonly(),
    isCurrentStepValid: isCurrentStepValidSignal.asReadonly(),
    initialize: vi.fn(),
    setCurrentStepFromPath: vi.fn(),
    completeCurrentStep: vi.fn(),
    reset: vi.fn(),
    _stepsSignal: stepsSignal,
    _submitResultSignal: submitResultSignal,
    _currentStepIndexSignal: currentStepIndexSignal,
    _canGoNextSignal: canGoNextSignal,
    _canGoPrevSignal: canGoPrevSignal,
    _isLastStepSignal: isLastStepSignal,
    _progressPercentSignal: progressPercentSignal,
    ...overrides,
  };
}

const TRANSLATIONS = {
  'wizard.progress.label': 'Progress',
  'wizard.navigation.label': 'Navigation',
  'wizard.success.title': 'Success!',
  'wizard.success.message': 'Form submitted',
  'wizard.actions.startOver': 'Start Over',
  'wizard.actions.back': 'Back',
  'wizard.actions.next': 'Next',
};

describe('MultiStepFormShellComponent', () => {
  let fixture: ComponentFixture<MultiStepFormShellComponent>;
  let component: MultiStepFormShellComponent;
  let mockStore: ReturnType<typeof buildMockStore>;
  let router: Router;

  beforeEach(async () => {
    mockStore = buildMockStore();

    await TestBed.configureTestingModule({
      imports: [MultiStepFormShellComponent, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'step-1', component: MockStepComponent },
          { path: 'step-2', component: MockStepComponent },
          { path: 'step-3', component: MockStepComponent },
        ]),
        { provide: MULTI_STEP_FORM_STORE, useValue: mockStore },
        { provide: MULTI_STEP_FORM_CONFIG, useValue: STEP_CONFIGS },
        { provide: ActivatedRoute, useValue: { snapshot: {} } },
        ...provideStubTranslationService(TRANSLATIONS),
      ]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { wizard: {
      progress: { label: 'Progress' },
      navigation: { label: 'Navigation' },
      success: { title: 'Success!', message: 'Form submitted' },
      actions: { startOver: 'Start Over', back: 'Back', next: 'Next' },
    }});
    translate.use('en');

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(MultiStepFormShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should call store.initialize() on init', () => {
      expect(mockStore.initialize).toHaveBeenCalledWith(STEP_CONFIGS);
    });
  });

  describe('Progress bar', () => {
    it('should render a progressbar element', () => {
      const progressbar = fixture.debugElement.query(By.css('[role="progressbar"]'));
      expect(progressbar).toBeTruthy();
    });

    it('should set aria-valuenow to progressPercent', () => {
      mockStore._progressPercentSignal.set(33);
      fixture.detectChanges();
      const bar = fixture.debugElement.query(By.css('[role="progressbar"]'));
      expect(bar.nativeElement.getAttribute('aria-valuenow')).toBe('33');
    });
  });

  describe('Navigation buttons', () => {
    it('should not show back button when canGoPrev is false', () => {
      mockStore._canGoPrevSignal.set(false);
      fixture.detectChanges();
      const backBtn = fixture.debugElement.query(By.css('[aria-label="Back"]'));
      expect(backBtn).toBeFalsy();
    });

    it('should show back button when canGoPrev is true', () => {
      mockStore._canGoPrevSignal.set(true);
      fixture.detectChanges();
      const backBtn = fixture.debugElement.queryAll(By.css('button')).find(
        b => b.nativeElement.textContent.includes('Back') || b.nativeElement.getAttribute('aria-label') === 'Back'
      );
      expect(backBtn).toBeTruthy();
    });

    it('should show next button when not on last step', () => {
      mockStore._isLastStepSignal.set(false);
      fixture.detectChanges();
      const nextBtn = fixture.debugElement.queryAll(By.css('button')).find(
        b => b.nativeElement.getAttribute('aria-label') === 'Next' || b.nativeElement.textContent.includes('Next')
      );
      expect(nextBtn).toBeTruthy();
    });

    it('should not show next button on last step', () => {
      mockStore._isLastStepSignal.set(true);
      fixture.detectChanges();
      const nextBtn = fixture.debugElement.queryAll(By.css('button')).find(
        b => b.nativeElement.textContent?.trim() === 'Next'
      );
      expect(nextBtn).toBeFalsy();
    });

    it('should disable next button when canGoNext is false', () => {
      mockStore._canGoNextSignal.set(false);
      mockStore._isLastStepSignal.set(false);
      fixture.detectChanges();
      const allButtons = fixture.debugElement.queryAll(By.css('button'));
      const nextBtn = allButtons.find(b =>
        b.nativeElement.getAttribute('aria-label') === 'Next' || b.nativeElement.textContent.includes('Next')
      );
      expect(nextBtn?.nativeElement.disabled).toBe(true);
    });
  });

  describe('Success state', () => {
    it('should show success section when submitResult is successful', () => {
      mockStore._submitResultSignal.set({ success: true, transactionId: 'TXN-123', timestamp: 1000 });
      fixture.detectChanges();
      const success = fixture.debugElement.query(By.css('.msf-shell__success'));
      expect(success).toBeTruthy();
    });

    it('should hide nav buttons in success state', () => {
      mockStore._submitResultSignal.set({ success: true, transactionId: 'TXN-123', timestamp: 1000 });
      fixture.detectChanges();
      const nav = fixture.debugElement.query(By.css('.msf-shell__nav'));
      expect(nav).toBeFalsy();
    });

    it('should show start-over button in success state', () => {
      mockStore._submitResultSignal.set({ success: true, transactionId: 'TXN-123', timestamp: 1000 });
      fixture.detectChanges();
      const btn = fixture.debugElement.queryAll(By.css('button')).find(
        b => b.nativeElement.textContent.includes('Start Over')
      );
      expect(btn).toBeTruthy();
    });
  });

  describe('goNext()', () => {
    it('should call store.completeCurrentStep() when canGoNext is true', () => {
      mockStore._canGoNextSignal.set(true);
      mockStore._currentStepIndexSignal.set(0);
      mockStore._stepsSignal.set(MOCK_STEPS);

      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component['goNext']();

      expect(mockStore.completeCurrentStep).toHaveBeenCalled();
    });

    it('should not call completeCurrentStep when canGoNext is false', () => {
      mockStore._canGoNextSignal.set(false);
      component['goNext']();
      expect(mockStore.completeCurrentStep).not.toHaveBeenCalled();
    });
  });

  describe('reset()', () => {
    it('should call store.reset()', () => {
      vi.spyOn(router, 'navigate').mockResolvedValue(true);
      component['reset']();
      expect(mockStore.reset).toHaveBeenCalled();
    });
  });
});
