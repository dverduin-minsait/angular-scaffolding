import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';
import { PersonalDataStepComponent } from './personal-data-step.component';
import { MULTI_STEP_FORM_STORE } from '../../../../shared/multi-step-form/tokens/multi-step-form.tokens';
import { provideStubTranslationService } from '../../../../testing/i18n-testing';

function buildMockStore(existingData: Record<string, unknown> = {}) {
  const formDataSignal = signal(existingData);
  return {
    formData: formDataSignal.asReadonly(),
    setCurrentStepValid: vi.fn(),
    setDirty: vi.fn(),
    updateStepData: vi.fn(),
    _formDataSignal: formDataSignal,
  };
}

const TRANSLATIONS = {
  'wizard.demo.steps.personalData': 'Personal Data',
  'wizard.demo.personalData.subtitle': 'Tell us about yourself',
  'wizard.demo.personalData.firstName': 'First Name',
  'wizard.demo.personalData.lastName': 'Last Name',
  'wizard.demo.personalData.email': 'Email',
  'wizard.demo.personalData.birthYear': 'Birth Year',
  'wizard.demo.personalData.firstNameError': 'First name is required',
  'wizard.demo.personalData.lastNameError': 'Last name is required',
  'wizard.demo.personalData.emailError': 'Valid email is required',
  'wizard.demo.personalData.birthYearError': 'Valid birth year is required',
};

describe('PersonalDataStepComponent', () => {
  let fixture: ComponentFixture<PersonalDataStepComponent>;
  let component: PersonalDataStepComponent;
  let mockStore: ReturnType<typeof buildMockStore>;

  beforeEach(async () => {
    mockStore = buildMockStore();

    await TestBed.configureTestingModule({
      imports: [PersonalDataStepComponent, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MULTI_STEP_FORM_STORE, useValue: mockStore },
        ...provideStubTranslationService(TRANSLATIONS),
      ]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      wizard: {
        demo: {
          steps: { personalData: 'Personal Data' },
          personalData: {
            subtitle: 'Tell us about yourself',
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email',
            birthYear: 'Birth Year',
            firstNameError: 'First name is required',
            lastNameError: 'Last name is required',
            emailError: 'Valid email is required',
            birthYearError: 'Valid birth year is required',
          }
        }
      }
    });
    translate.use('en');

    fixture = TestBed.createComponent(PersonalDataStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render the form', () => {
      const form = fixture.debugElement.query(By.css('.personal-data-step__form'));
      expect(form).toBeTruthy();
    });
  });

  describe('Form fields', () => {
    it('should render firstName input', () => {
      const input = fixture.debugElement.query(By.css('#firstName'));
      expect(input).toBeTruthy();
    });

    it('should render lastName input', () => {
      const input = fixture.debugElement.query(By.css('#lastName'));
      expect(input).toBeTruthy();
    });

    it('should render email input', () => {
      const input = fixture.debugElement.query(By.css('#email'));
      expect(input).toBeTruthy();
    });

    it('should render birthYear input', () => {
      const input = fixture.debugElement.query(By.css('#birthYear'));
      expect(input).toBeTruthy();
    });
  });

  describe('Store validity sync', () => {
    it('should call setCurrentStepValid(false) initially when form is invalid', () => {
      expect(mockStore.setCurrentStepValid).toHaveBeenCalledWith(false);
    });

    it('should call setCurrentStepValid(true) when all required fields are valid', () => {
      fillValidForm();
      fixture.detectChanges();
      expect(mockStore.setCurrentStepValid).toHaveBeenCalledWith(true);
    });
  });

  describe('Pre-population from store', () => {
    it('should pre-fill firstName from store formData', async () => {
      mockStore._formDataSignal.set({ firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com', birthYear: 1990 });

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [PersonalDataStepComponent, TranslateModule.forRoot()],
        providers: [
          provideZonelessChangeDetection(),
          {
            provide: MULTI_STEP_FORM_STORE,
            useValue: buildMockStore({ firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com', birthYear: 1990 })
          },
          ...provideStubTranslationService(TRANSLATIONS),
        ]
      }).compileComponents();

      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('en', { wizard: { demo: { steps: { personalData: 'Personal Data' }, personalData: { subtitle: '', firstName: 'First Name', lastName: 'Last Name', email: 'Email', birthYear: 'Birth Year', firstNameError: '', lastNameError: '', emailError: '', birthYearError: '' } } } });
      translate.use('en');

      const newFixture = TestBed.createComponent(PersonalDataStepComponent);
      newFixture.detectChanges();

      const firstNameInput = newFixture.nativeElement.querySelector('#firstName') as HTMLInputElement;
      expect(firstNameInput.value).toBe('Alice');
    });
  });

  describe('Dirty state', () => {
    it('should call store.setDirty(true) when form changes', () => {
      const input = fixture.nativeElement.querySelector('#firstName') as HTMLInputElement;
      input.value = 'Bob';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(mockStore.setDirty).toHaveBeenCalledWith(true);
    });
  });

  describe('Data update on valid form', () => {
    it('should call store.updateStepData() when form is valid', () => {
      fillValidForm();
      fixture.detectChanges();
      expect(mockStore.updateStepData).toHaveBeenCalled();
    });
  });

  describe('Error visibility', () => {
    it('should not show error messages before user interaction', () => {
      const errors = fixture.debugElement.queryAll(By.css('.personal-data-step__error'));
      expect(errors).toHaveLength(0);
    });
  });

  describe('Page heading', () => {
    it('should render the step title', () => {
      const title = fixture.debugElement.query(By.css('.personal-data-step__title'));
      expect(title).toBeTruthy();
    });
  });

  // Helpers
  function fillValidForm() {
    setInputValue('#firstName', 'Alice');
    setInputValue('#lastName', 'Smith');
    setInputValue('#email', 'alice@example.com');
    setInputValue('#birthYear', '1990');
  }

  function setInputValue(selector: string, value: string) {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
});
