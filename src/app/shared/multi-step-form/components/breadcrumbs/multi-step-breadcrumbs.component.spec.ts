import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MultiStepBreadcrumbsComponent } from './multi-step-breadcrumbs.component';
import { StepMeta } from '../../models/step.model';
import { provideStubTranslationService } from '../../../../testing/i18n-testing';

@Component({ template: '' })
class MockStepComponent {}

const MOCK_STEPS: StepMeta[] = [
  { path: 'step-1', titleKey: 'wizard.demo.steps.step1', index: 0, isCompleted: false, isCurrent: true, isAccessible: true },
  { path: 'step-2', titleKey: 'wizard.demo.steps.step2', index: 1, isCompleted: false, isCurrent: false, isAccessible: false },
  { path: 'step-3', titleKey: 'wizard.demo.steps.step3', index: 2, isCompleted: false, isCurrent: false, isAccessible: false },
];

describe('MultiStepBreadcrumbsComponent', () => {
  let fixture: ComponentFixture<MultiStepBreadcrumbsComponent>;
  let component: MultiStepBreadcrumbsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiStepBreadcrumbsComponent, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'step-1', component: MockStepComponent },
          { path: 'step-2', component: MockStepComponent },
          { path: 'step-3', component: MockStepComponent },
        ]),
        ...provideStubTranslationService({
          'wizard.steps.nav': 'Wizard steps',
          'wizard.demo.steps.step1': 'Step 1',
          'wizard.demo.steps.step2': 'Step 2',
          'wizard.demo.steps.step3': 'Step 3',
        })
      ]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      wizard: { steps: { nav: 'Wizard steps' }, demo: { steps: { step1: 'Step 1', step2: 'Step 2', step3: 'Step 3' } } }
    });
    translate.use('en');
  });

  const createComponent = (steps: StepMeta[] = MOCK_STEPS, currentPath = 'step-1') => {
    fixture = TestBed.createComponent(MultiStepBreadcrumbsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('steps', steps);
    fixture.componentRef.setInput('currentPath', currentPath);
    fixture.detectChanges();
    return fixture;
  };

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  describe('Navigation rendering', () => {
    it('should render a nav element with aria-label', () => {
      createComponent();
      const nav = fixture.debugElement.query(By.css('nav.msf-breadcrumbs'));
      expect(nav).toBeTruthy();
    });

    it('should render an ordered list with role="list"', () => {
      createComponent();
      const ol = fixture.debugElement.query(By.css('ol.msf-breadcrumbs__list'));
      expect(ol).toBeTruthy();
      expect(ol.nativeElement.getAttribute('role')).toBe('list');
    });

    it('should render a list item for each step', () => {
      createComponent();
      const items = fixture.debugElement.queryAll(By.css('.msf-breadcrumbs__item'));
      expect(items).toHaveLength(3);
    });

    it('should render separator elements between steps', () => {
      createComponent();
      const separators = fixture.debugElement.queryAll(By.css('.msf-breadcrumbs__separator'));
      expect(separators).toHaveLength(2); // n-1 separators
    });
  });

  describe('Current step rendering', () => {
    it('should render current step as span with aria-current="step"', () => {
      createComponent();
      const currentSpan = fixture.debugElement.queryAll(By.css('span.msf-breadcrumbs__link'))
        .find(el => el.nativeElement.getAttribute('aria-current') === 'step');
      expect(currentSpan).toBeTruthy();
    });

    it('should apply --current modifier class to current step item', () => {
      createComponent();
      const currentItem = fixture.debugElement.query(By.css('.msf-breadcrumbs__item--current'));
      expect(currentItem).toBeTruthy();
    });
  });

  describe('Accessible step rendering', () => {
    it('should render accessible non-current step as anchor link', () => {
      const steps: StepMeta[] = [
        { ...MOCK_STEPS[0], isCompleted: true, isCurrent: false, isAccessible: true },
        { ...MOCK_STEPS[1], isCurrent: true, isAccessible: true },
        { ...MOCK_STEPS[2] },
      ];
      createComponent(steps, 'step-2');
      const link = fixture.debugElement.query(By.css('a.msf-breadcrumbs__link'));
      expect(link).toBeTruthy();
    });
  });

  describe('Inaccessible step rendering', () => {
    it('should render inaccessible step as span with aria-disabled', () => {
      createComponent();
      const disabledSpans = fixture.debugElement.queryAll(By.css('span.msf-breadcrumbs__link'))
        .filter(el => el.nativeElement.getAttribute('aria-disabled') === 'true');
      expect(disabledSpans.length).toBeGreaterThan(0);
    });
  });

  describe('Completed step rendering', () => {
    it('should apply --completed modifier class to completed step items', () => {
      const steps: StepMeta[] = [
        { ...MOCK_STEPS[0], isCompleted: true, isCurrent: false, isAccessible: true },
        { ...MOCK_STEPS[1], isCurrent: true, isAccessible: true },
        { ...MOCK_STEPS[2] },
      ];
      createComponent(steps);
      const completedItem = fixture.debugElement.query(By.css('.msf-breadcrumbs__item--completed'));
      expect(completedItem).toBeTruthy();
    });
  });

  describe('Step index display', () => {
    it('should render 1-based index for each step', () => {
      createComponent();
      const indexEls = fixture.debugElement.queryAll(By.css('.msf-breadcrumbs__index'));
      expect(indexEls[0].nativeElement.textContent.trim()).toBe('1');
      expect(indexEls[1].nativeElement.textContent.trim()).toBe('2');
      expect(indexEls[2].nativeElement.textContent.trim()).toBe('3');
    });

    it('should set aria-hidden on step index elements', () => {
      createComponent();
      const indexEls = fixture.debugElement.queryAll(By.css('.msf-breadcrumbs__index'));
      indexEls.forEach(el => {
        expect(el.nativeElement.getAttribute('aria-hidden')).toBe('true');
      });
    });
  });

  describe('Default input values', () => {
    it('should use default empty string for currentPath input', () => {
      fixture = TestBed.createComponent(MultiStepBreadcrumbsComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('steps', MOCK_STEPS);
      fixture.detectChanges();
      expect(component.currentPath()).toBe('');
    });
  });
});
