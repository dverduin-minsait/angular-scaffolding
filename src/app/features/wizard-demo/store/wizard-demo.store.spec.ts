import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { WizardDemoStore } from './wizard-demo.store';
import { StepConfig } from '../../shared/multi-step-form/models/step.model';

const WIZARD_STEP_CONFIGS: StepConfig[] = [
  { path: 'personal-data', titleKey: 'wizard.demo.steps.personalData', index: 0 },
  { path: 'hobbies', titleKey: 'wizard.demo.steps.hobbies', index: 1 },
  { path: 'product', titleKey: 'wizard.demo.steps.product', index: 2 },
  { path: 'payment', titleKey: 'wizard.demo.steps.payment', index: 3 },
];

describe('WizardDemoStore', () => {
  let store: WizardDemoStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [WizardDemoStore, provideZonelessChangeDetection()]
    }).compileComponents();
    store = TestBed.inject(WizardDemoStore);
  });

  it('should be creatable via TestBed', () => {
    expect(store).toBeTruthy();
  });

  it('should extend MultiStepFormStore and have initialize()', () => {
    expect(store.initialize).toBeDefined();
  });

  it('should initialize 4 wizard steps', () => {
    store.initialize(WIZARD_STEP_CONFIGS);
    expect(store.steps()).toHaveLength(4);
  });

  it('should have all 4 wizard step paths', () => {
    store.initialize(WIZARD_STEP_CONFIGS);
    const paths = store.steps().map(s => s.path);
    expect(paths).toContain('personal-data');
    expect(paths).toContain('hobbies');
    expect(paths).toContain('product');
    expect(paths).toContain('payment');
  });

  it('should allow typed form data updates', () => {
    store.initialize(WIZARD_STEP_CONFIGS);
    store.updateStepData({ firstName: 'Alice', email: 'alice@test.com' });
    const data = store.formData();
    expect(data.firstName).toBe('Alice');
    expect(data.email).toBe('alice@test.com');
  });

  it('should complete first step and unlock second', () => {
    store.initialize(WIZARD_STEP_CONFIGS);
    store.completeCurrentStep({ firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com', birthYear: 1990 });
    expect(store.steps()[0].isCompleted).toBe(true);
    expect(store.steps()[1].isAccessible).toBe(true);
  });

  it('should track progress through all 4 steps', () => {
    store.initialize(WIZARD_STEP_CONFIGS);
    expect(store.progressPercent()).toBe(0);

    store.completeCurrentStep();
    expect(store.progressPercent()).toBe(25);

    store.setCurrentStepFromPath('hobbies');
    store.completeCurrentStep();
    expect(store.progressPercent()).toBe(50);
  });
});
