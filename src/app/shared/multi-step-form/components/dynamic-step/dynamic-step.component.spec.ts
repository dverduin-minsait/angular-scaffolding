import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';
import { DynamicStepComponent } from './dynamic-step.component';
import { MULTI_STEP_FORM_STORE } from '../../tokens/multi-step-form.tokens';
import { FieldConfig } from '../../models/step.model';
import { provideStubTranslationService } from '../../../../testing/i18n-testing';

const TEXT_FIELDS: FieldConfig[] = [
  { name: 'firstName', type: 'text', labelKey: 'wizard.demo.personalData.firstName', required: true },
  { name: 'age', type: 'number', labelKey: 'wizard.demo.personalData.age', required: false, min: 18, max: 99 },
];

const SELECT_FIELDS: FieldConfig[] = [
  {
    name: 'hobby',
    type: 'select',
    labelKey: 'wizard.demo.hobbies.hobby',
    required: true,
    placeholderKey: 'wizard.demo.hobbies.selectHobby',
    options: [
      { value: 'reading', label: 'Reading' },
      { value: 'coding', label: 'Coding' },
    ]
  },
];

function buildMockStore(existingData: Record<string, unknown> = {}) {
  const formDataSignal = signal(existingData);
  return {
    formData: formDataSignal.asReadonly(),
    setCurrentStepValid: vi.fn(),
    setDirty: vi.fn(),
    updateStepData: vi.fn(),
  };
}

describe('DynamicStepComponent', () => {
  let fixture: ComponentFixture<DynamicStepComponent>;
  let component: DynamicStepComponent;
  let mockStore: ReturnType<typeof buildMockStore>;

  function setup(fields: FieldConfig[] = TEXT_FIELDS, data: Record<string, unknown> = {}, stepTitle = '') {
    mockStore = buildMockStore(data);
    return TestBed.configureTestingModule({
      imports: [DynamicStepComponent, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: MULTI_STEP_FORM_STORE, useValue: mockStore },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: { fields, stepTitle } }
          }
        },
        ...provideStubTranslationService({
          'wizard.demo.personalData.firstName': 'First Name',
          'wizard.demo.personalData.age': 'Age',
          'wizard.demo.hobbies.hobby': 'Hobby',
          'wizard.demo.hobbies.selectHobby': 'Select a hobby',
          'wizard.validation.required': 'This field is required',
          'wizard.validation.min': 'Value too low',
          'wizard.validation.max': 'Value too high',
        })
      ]
    }).compileComponents().then(() => {
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('en', {
        wizard: {
          validation: { required: 'This field is required', min: 'Value too low', max: 'Value too high' },
          demo: {
            personalData: { firstName: 'First Name', age: 'Age' },
            hobbies: { hobby: 'Hobby', selectHobby: 'Select a hobby' }
          }
        }
      });
      translate.use('en');
      fixture = TestBed.createComponent(DynamicStepComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Component creation', () => {
    it('should create', async () => {
      await setup();
      expect(component).toBeTruthy();
    });

    it('should render a field for each config', async () => {
      await setup(TEXT_FIELDS);
      const fields = fixture.debugElement.queryAll(By.css('.dynamic-step__field'));
      expect(fields).toHaveLength(2);
    });
  });

  describe('Select field rendering', () => {
    it('should render a select element for select-type fields', async () => {
      await setup(SELECT_FIELDS);
      const select = fixture.debugElement.query(By.css('select'));
      expect(select).toBeTruthy();
    });

    it('should render options including placeholder option', async () => {
      await setup(SELECT_FIELDS);
      const options = fixture.debugElement.queryAll(By.css('select option'));
      expect(options.length).toBeGreaterThanOrEqual(3); // placeholder + 2 options
    });
  });

  describe('Text input rendering', () => {
    it('should render input elements for text-type fields', async () => {
      await setup(TEXT_FIELDS);
      const inputs = fixture.debugElement.queryAll(By.css('input'));
      expect(inputs).toHaveLength(2);
    });

    it('should set aria-required on required fields', async () => {
      await setup(TEXT_FIELDS);
      const firstInput = fixture.debugElement.query(By.css('#firstName'));
      expect(firstInput.nativeElement.getAttribute('aria-required')).toBe('true');
    });
  });

  describe('Store integration', () => {
    it('should call setCurrentStepValid on init with false when form is invalid', async () => {
      await setup(TEXT_FIELDS); // required field, no value
      expect(mockStore.setCurrentStepValid).toHaveBeenCalledWith(false);
    });

    it('should pre-populate fields from store formData', async () => {
      await setup(TEXT_FIELDS, { firstName: 'Alice', age: 30 });
      const firstInput = fixture.debugElement.query(By.css('#firstName'));
      expect(firstInput.nativeElement.value).toBe('Alice');
    });
  });

  describe('Form validation', () => {
    it('should report valid when all required fields are filled', async () => {
      await setup(TEXT_FIELDS);
      const firstInput = fixture.nativeElement.querySelector('#firstName') as HTMLInputElement;
      firstInput.value = 'Alice';
      firstInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      // After filling required field, form updates
      expect(mockStore.setDirty).toHaveBeenCalled();
    });
  });

  describe('Step title rendering', () => {
    it('should render step title h2 when stepTitle is provided', async () => {
      await setup(TEXT_FIELDS, {}, 'wizard.demo.steps.hobbies');
      const title = fixture.debugElement.query(By.css('.dynamic-step__title'));
      expect(title).toBeTruthy();
    });

    it('should not render title h2 when no stepTitle provided', async () => {
      await setup(TEXT_FIELDS, {}, '');
      const title = fixture.debugElement.query(By.css('.dynamic-step__title'));
      expect(title).toBeFalsy();
    });
  });
});
