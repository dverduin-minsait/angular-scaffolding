import { Routes } from '@angular/router';
import { StepConfig } from '../../shared/multi-step-form/models/step.model';
import { FieldConfig } from '../../shared/multi-step-form/models/step.model';
import { MultiStepFormShellComponent } from '../../shared/multi-step-form/components/multi-step-form-shell/multi-step-form-shell.component';
import { WizardDemoStore } from './store/wizard-demo.store';
import { MULTI_STEP_FORM_STORE, MULTI_STEP_FORM_CONFIG, PAYMENT_SERVICE } from '../../shared/multi-step-form/tokens/multi-step-form.tokens';
import { MockPaymentService } from '../../shared/multi-step-form/services/mock-payment.service';
import { stepNavigationGuard } from '../../shared/multi-step-form/guards/step-navigation.guard';

export const WIZARD_STEP_CONFIGS: StepConfig[] = [
  { path: 'personal-data', titleKey: 'wizard.demo.steps.personalData', index: 0 },
  { path: 'hobbies', titleKey: 'wizard.demo.steps.hobbies', index: 1 },
  { path: 'product', titleKey: 'wizard.demo.steps.product', index: 2 },
  { path: 'payment', titleKey: 'wizard.demo.steps.payment', index: 3 },
];

const HOBBIES_FIELDS: FieldConfig[] = [
  {
    name: 'hobby',
    type: 'select',
    labelKey: 'wizard.demo.hobbies.hobby',
    placeholderKey: 'wizard.demo.hobbies.hobbyPlaceholder',
    required: true,
    options: [
      { value: 'cycling', label: 'Cycling' },
      { value: 'running', label: 'Running' },
      { value: 'swimming', label: 'Swimming' },
      { value: 'hiking', label: 'Hiking' },
      { value: 'climbing', label: 'Climbing' },
      { value: 'yoga', label: 'Yoga' },
      { value: 'gym', label: 'Gym / Fitness' },
      { value: 'other', label: 'Other' },
    ],
  },
  {
    name: 'experienceLevel',
    type: 'select',
    labelKey: 'wizard.demo.hobbies.experienceLevel',
    placeholderKey: 'wizard.demo.hobbies.experienceLevelPlaceholder',
    required: true,
    options: [
      { value: 'beginner', label: 'Beginner (< 1 year)' },
      { value: 'intermediate', label: 'Intermediate (1–3 years)' },
      { value: 'advanced', label: 'Advanced (3+ years)' },
      { value: 'expert', label: 'Expert / Professional' },
    ],
  },
];

const PRODUCT_FIELDS: FieldConfig[] = [
  {
    name: 'product',
    type: 'select',
    labelKey: 'wizard.demo.product.product',
    placeholderKey: 'wizard.demo.product.productPlaceholder',
    required: true,
    options: [
      { value: 'sport-watch', label: 'Sport Watch' },
      { value: 'running-shoes', label: 'Running Shoes' },
      { value: 'cycling-helmet', label: 'Cycling Helmet' },
      { value: 'yoga-mat', label: 'Yoga Mat' },
      { value: 'hiking-backpack', label: 'Hiking Backpack' },
      { value: 'swimming-goggles', label: 'Swimming Goggles' },
    ],
  },
  {
    name: 'price',
    type: 'number',
    labelKey: 'wizard.demo.product.price',
    placeholderKey: 'wizard.demo.product.pricePlaceholder',
    required: true,
    min: 1,
    max: 10000,
  },
];

export const WIZARD_DEMO_ROUTES: Routes = [
  {
    path: '',
    component: MultiStepFormShellComponent,
    providers: [
      WizardDemoStore,
      { provide: MULTI_STEP_FORM_STORE, useExisting: WizardDemoStore },
      { provide: PAYMENT_SERVICE, useClass: MockPaymentService },
      { provide: MULTI_STEP_FORM_CONFIG, useValue: WIZARD_STEP_CONFIGS },
    ],
    canActivateChild: [stepNavigationGuard],
    data: { breadcrumb: 'Wizard Demo' },
    children: [
      { path: '', redirectTo: 'personal-data', pathMatch: 'full' },
      {
        path: 'personal-data',
        data: { stepIndex: 0, breadcrumb: 'Personal Data' },
        loadComponent: () =>
          import('./steps/personal-data/personal-data-step.component').then(
            m => m.PersonalDataStepComponent
          ),
      },
      {
        path: 'hobbies',
        data: {
          stepIndex: 1,
          breadcrumb: 'Hobbies',
          stepTitle: 'wizard.demo.steps.hobbies',
          fields: HOBBIES_FIELDS,
        },
        loadComponent: () =>
          import('../../shared/multi-step-form/components/dynamic-step/dynamic-step.component').then(
            m => m.DynamicStepComponent
          ),
      },
      {
        path: 'product',
        data: {
          stepIndex: 2,
          breadcrumb: 'Product',
          stepTitle: 'wizard.demo.steps.product',
          fields: PRODUCT_FIELDS,
        },
        loadComponent: () =>
          import('../../shared/multi-step-form/components/dynamic-step/dynamic-step.component').then(
            m => m.DynamicStepComponent
          ),
      },
      {
        path: 'payment',
        data: { stepIndex: 3, breadcrumb: 'Payment' },
        loadComponent: () =>
          import('../../shared/multi-step-form/components/payment-step/payment-step.component').then(
            m => m.PaymentStepComponent
          ),
      },
    ],
  },
];
