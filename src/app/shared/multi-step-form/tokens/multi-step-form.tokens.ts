import { InjectionToken } from '@angular/core';
import { MultiStepFormStore } from '../store/multi-step-form.store';
import { StepConfig } from '../models/step.model';
import { PaymentService } from '../services/payment.service';

/**
 * Token for the active MultiStepFormStore.
 * Routes provide a concrete store (e.g. WizardDemoStore) via this token.
 */
export const MULTI_STEP_FORM_STORE = new InjectionToken<
  MultiStepFormStore<Record<string, unknown>>
>('MULTI_STEP_FORM_STORE');

/**
 * Token for the wizard step configuration array.
 * Routes provide the StepConfig[] via this token.
 */
export const MULTI_STEP_FORM_CONFIG = new InjectionToken<StepConfig[]>(
  'MULTI_STEP_FORM_CONFIG'
);

/**
 * Token for the payment service implementation.
 * Routes provide MockPaymentService (or real impl) via this token.
 */
export const PAYMENT_SERVICE = new InjectionToken<PaymentService>('PAYMENT_SERVICE');
