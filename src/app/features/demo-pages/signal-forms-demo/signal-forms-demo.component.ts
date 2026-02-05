import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  FormField,
  type FieldTree,
  type SchemaFn,
  disabled,
  form,
  max,
  min,
  required,
  validate
} from '@angular/forms/signals';
import type { ValidationError } from '@angular/forms/signals';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonDirective } from '../../../shared/directives';
import { SelectMultipleComponent } from '../../../shared/components/form/select-multiple/select-multiple.component';
import {
  type HouseSavingsModel,
  SignalFormsDemoService
} from './signal-forms-demo.service';

import { clamp } from './signal-forms-demo.utils';

@Component({
  selector: 'app-signal-forms-demo',
  standalone: true,
  imports: [TranslateModule, FormField, ButtonDirective, DecimalPipe, SelectMultipleComponent],
  providers: [SignalFormsDemoService],
  templateUrl: './signal-forms-demo.component.html',
  styleUrl: './signal-forms-demo.component.scss'
})
/**
 * Demo page for Angular Signal Forms.
 *
 * Highlights:
 * - Model stored in a signal (`model`) and bound to the form schema.
 * - Cross-field validation (down payment affects loan constraints).
 * - Derived business values computed as signals (totals, monthly payment, etc.).
 * - A11y-friendly error summary with "focus first invalid" affordance.
 */
export class SignalFormsDemoComponent {
  private readonly business = inject(SignalFormsDemoService);
  private readonly initialModel: HouseSavingsModel = this.business.createInitialModel();

  /** Writable model signal used by Signal Forms. */
  protected readonly model = signal<HouseSavingsModel>(this.initialModel);

  private readonly businessSignals = this.business.createBusinessSignals(this.model);

  protected readonly taxKind = this.businessSignals.taxKind;
  protected readonly taxRateLabelKey = this.businessSignals.taxRateLabelKey;

  protected readonly downPaymentAmount = this.businessSignals.downPaymentAmount;
  protected readonly loanAmount = this.businessSignals.loanAmount;
  protected readonly taxAmount = this.businessSignals.taxAmount;
  protected readonly commissionAmount = this.businessSignals.commissionAmount;
  protected readonly realEstateCommissionAmount = this.businessSignals.realEstateCommissionAmount;
  protected readonly feesAmount = this.businessSignals.feesAmount;

  protected readonly upfrontTotal = this.businessSignals.upfrontTotal;
  protected readonly estimatedMonthlyPayment = this.businessSignals.estimatedMonthlyPayment;

  /**
   * Signal Forms schema (validators + enabled/disabled rules).
   *
   * Custom error kinds used by this demo:
   * - `minDownPaymentFirstHand`: first-hand purchases require at least 10% down payment
   * - `loanTooHigh`: loan exceeds 90% of home price
   */
  private readonly formSchema: SchemaFn<HouseSavingsModel> = p => {
    required(p.purchaseKind);
    required(p.region);
    validate(p.compareRegions, () => undefined);
    required(p.purchaseDate);

    required(p.homePrice);
    min(p.homePrice, 40_000);
    max(p.homePrice, 10_000_000);

    required(p.downPaymentPercent);
    min(p.downPaymentPercent, 0);
    max(p.downPaymentPercent, 60);
    validate(p.downPaymentPercent, ctx => {
      const percent = clamp(ctx.value(), 0, 100);
      const homePrice = ctx.valueOf(p.homePrice);
      const loan = homePrice * (1 - percent / 100);

      const isFirstHand = ctx.valueOf(p.purchaseKind) === 'firstHand';
      if (isFirstHand && percent < 10) {
        return { kind: 'minDownPaymentFirstHand' } as ValidationError.WithoutField;
      }

      if (loan > homePrice * 0.9) {
        return { kind: 'loanTooHigh' } as ValidationError.WithoutField;
      }

      return undefined;
    });

    required(p.loanYears);
    min(p.loanYears, 1);
    max(p.loanYears, 40);

    required(p.interestType);
    required(p.interestRate);
    min(p.interestRate, 0);
    max(p.interestRate, 20);

    required(p.taxRate);
    min(p.taxRate, 0);
    max(p.taxRate, 25);

    required(p.notaryFee);
    min(p.notaryFee, 0);
    required(p.registryFee);
    min(p.registryFee, 0);
    required(p.appraisalFee);
    min(p.appraisalFee, 0);

    disabled(p.commissionRate, ctx => ctx.valueOf(p.purchaseKind) !== 'firstHand');
    required(p.commissionRate, { when: ctx => ctx.valueOf(p.purchaseKind) === 'firstHand' });
    min(p.commissionRate, 0);
    max(p.commissionRate, 5);

    disabled(p.realEstateCommissionRate, ctx => ctx.valueOf(p.purchaseKind) !== 'secondHand');
    required(p.realEstateCommissionRate, { when: ctx => ctx.valueOf(p.purchaseKind) === 'secondHand' });
    min(p.realEstateCommissionRate, 0);
    max(p.realEstateCommissionRate, 5);
  };

  protected readonly houseForm = form(this.model, this.formSchema);
  protected readonly hasErrors = computed(() => this.houseForm().invalid());
  protected readonly errorCount = computed(() => this.houseForm().errorSummary().length);

  constructor() {
    this.business.setupBusinessRules(this.model);
  }

  /** Resets the model and the form state back to the initial defaults. */
  protected resetDefaults(): void {
    const defaults = { ...this.initialModel };
    this.model.set(defaults);
    this.houseForm().reset(defaults);
  }

  /** Moves focus to the first invalid bound form control (for error summary UX). */
  protected focusFirstInvalid(): void {
    this.houseForm().focusBoundControl();
  }

  /** Returns true if the field currently has any validation errors. */
  protected hasFieldError(field: FieldTree<unknown> | null | undefined): boolean {
    if (!field) return false;
    return field().errors().length > 0;
  }

  /**
   * Maps Signal Forms error kinds to i18n translation keys.
   *
   * Only the first error is shown to keep the UI compact.
   */
  protected getErrorKey(field: FieldTree<unknown> | null | undefined): string | null {
    if (!field) return null;
    const errors = field().errors();
    if (!errors.length) return null;

    const kind = errors[0]?.kind;
    if (!kind) return 'app.homeSavings.errors.unknown';

    switch (kind) {
      case 'required':
        return 'app.homeSavings.errors.required';
      case 'min':
        return 'app.homeSavings.errors.min';
      case 'max':
        return 'app.homeSavings.errors.max';
      case 'minLength':
        return 'app.homeSavings.errors.minLength';
      case 'maxLength':
        return 'app.homeSavings.errors.maxLength';
      case 'pattern':
        return 'app.homeSavings.errors.pattern';
      case 'email':
        return 'app.homeSavings.errors.email';
      case 'minDownPaymentFirstHand':
        return 'app.homeSavings.errors.minDownPaymentFirstHand';
      case 'requiredTrue':
        return 'app.homeSavings.errors.requiredTrue';
      case 'loanTooHigh':
        return 'app.homeSavings.errors.loanTooHigh';
      default:
        return 'app.homeSavings.errors.unknown';
    }
  }
}
