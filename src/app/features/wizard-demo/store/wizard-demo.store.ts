import { Injectable } from '@angular/core';
import { MultiStepFormStore } from '../../../shared/multi-step-form/store/multi-step-form.store';

export interface WizardDemoData extends Record<string, unknown> {
  // Step 1: Personal data
  firstName: string;
  lastName: string;
  email: string;
  birthYear: number;
  // Step 2: Hobbies (dynamic step)
  hobby: string;
  experienceLevel: string;
  // Step 3: Product (dynamic step)
  product: string;
  price: number;
  // Step 4: Payment
  paymentResult: unknown;
}

@Injectable()
export class WizardDemoStore extends MultiStepFormStore<WizardDemoData> {}
