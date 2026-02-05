import { Injectable, computed, effect, type Signal, type WritableSignal } from '@angular/core';
import { clamp } from './signal-forms-demo.utils';

/** Purchase context: newly built (developer) vs. resale (private). */
export type PurchaseKind = 'firstHand' | 'secondHand';
/** Spanish regions used to demo region-based ITP defaults. */
export type Region = 'madrid' | 'catalonia' | 'valencia' | 'andalusia' | 'other';
/** Mortgage interest kind (demo input; payment formula assumes fixed amortization). */
export type InterestType = 'fixed' | 'variable';
/** Tax kind implied by purchase kind (IVA for first-hand, ITP for second-hand). */
export type TaxKind = 'iva' | 'itp';

/**
 * Form model used by the Signal Forms demo.
 *
 * Notes:
 * - Percent-like fields are expressed as 0..100 values.
 * - `purchaseDate` is stored as an ISO `YYYY-MM-DD` string (compatible with `<input type="date">`).
 */
export interface HouseSavingsModel {
  purchaseKind: PurchaseKind;
  region: Region;
  compareRegions: Region[];
  purchaseDate: string;
  homePrice: number;
  isPrimaryResidence: boolean;

  downPaymentPercent: number;
  loanYears: number;
  interestType: InterestType;
  interestRate: number;

  taxRate: number;
  commissionRate: number;

  realEstateCommissionRate: number;

  notaryFee: number;
  registryFee: number;
  appraisalFee: number;
}

/** Default IVA rate (%), used for first-hand purchases. */
const DEFAULT_IVA_RATE = 10;
/** Default ITP rate (%), used for second-hand purchases (varies by region). */
const DEFAULT_ITP_RATE: Record<Region, number> = {
  madrid: 6,
  catalonia: 10,
  valencia: 10,
  andalusia: 7,
  other: 8
};

/**
 * Read-only derived values computed from `HouseSavingsModel`.
 *
 * These are exposed as `Signal<T>` so the component template can render them
 * without manual subscriptions (zoneless friendly).
 */
export interface HouseSavingsBusinessSignals {
  readonly taxKind: Signal<TaxKind>;
  readonly taxRateLabelKey: Signal<string>;

  readonly downPaymentAmount: Signal<number>;
  readonly loanAmount: Signal<number>;
  readonly taxAmount: Signal<number>;
  readonly commissionAmount: Signal<number>;
  readonly realEstateCommissionAmount: Signal<number>;
  readonly feesAmount: Signal<number>;

  readonly upfrontTotal: Signal<number>;
  readonly estimatedMonthlyPayment: Signal<number>;
}

@Injectable()
/**
 * Business logic for the Signal Forms demo.
 *
 * This service deliberately avoids HTTP and stores no global state; it only
 * derives values from a model signal and applies business rules via effects.
 */
export class SignalFormsDemoService {
  /**
   * Creates a baseline model used for demo defaults and reset behavior.
   *
   * The date is initialized to "today" in `YYYY-MM-DD` format.
   */
  createInitialModel(): HouseSavingsModel {
    return {
      purchaseKind: 'firstHand',
      region: 'madrid',
      compareRegions: ['madrid', 'catalonia'],
      purchaseDate: new Date().toISOString().slice(0, 10),
      homePrice: 250_000,
      isPrimaryResidence: true,

      downPaymentPercent: 13,
      loanYears: 30,
      interestType: 'fixed',
      interestRate: 3.25,

      taxRate: DEFAULT_IVA_RATE,
      commissionRate: 1.0,

      realEstateCommissionRate: 4.0,

      notaryFee: 1_200,
      registryFee: 600,
      appraisalFee: 450
    };
  }

  /**
   * Creates computed signals derived from the current form model.
   *
   * Calculations:
   * - Down payment: `homePrice * downPaymentPercent / 100`
   * - Loan amount: `max(0, homePrice - downPaymentAmount)`
   * - Taxes/fees/commissions: percentage of `homePrice` + fixed fees
   * - Monthly payment: standard amortization formula (0% interest handled)
   */
  createBusinessSignals(model: Signal<HouseSavingsModel>): HouseSavingsBusinessSignals {
    const taxKind = computed(() => (model().purchaseKind === 'firstHand' ? 'iva' : 'itp'));
    const taxRateLabelKey = computed(() =>
      taxKind() === 'iva'
        ? 'app.homeSavings.form.fields.taxRate.ivaLabel'
        : 'app.homeSavings.form.fields.taxRate.itpLabel'
    );

    const downPaymentAmount = computed(() => {
      const value = model();
      const percent = clamp(value.downPaymentPercent, 0, 100);
      return (value.homePrice * percent) / 100;
    });

    const loanAmount = computed(() => {
      const value = model();
      return Math.max(0, value.homePrice - downPaymentAmount());
    });

    const taxAmount = computed(() => {
      const value = model();
      return Math.max(0, (value.homePrice * clamp(value.taxRate, 0, 100)) / 100);
    });

    const commissionAmount = computed(() => {
      const value = model();
      if (value.purchaseKind !== 'firstHand') {
        return 0;
      }
      return Math.max(0, (value.homePrice * clamp(value.commissionRate, 0, 100)) / 100);
    });

    const realEstateCommissionAmount = computed(() => {
      const value = model();
      if (value.purchaseKind !== 'secondHand') {
        return 0;
      }
      return Math.max(0, (value.homePrice * clamp(value.realEstateCommissionRate, 0, 100)) / 100);
    });

    const feesAmount = computed(() => {
      const value = model();
      return (
        (Number.isFinite(value.notaryFee) ? value.notaryFee : 0) +
        (Number.isFinite(value.registryFee) ? value.registryFee : 0) +
        (Number.isFinite(value.appraisalFee) ? value.appraisalFee : 0)
      );
    });

    const upfrontTotal = computed(
      () => downPaymentAmount() + taxAmount() + feesAmount() + commissionAmount() + realEstateCommissionAmount()
    );

    const estimatedMonthlyPayment = computed(() => {
      const value = model();
      const principal = loanAmount();
      const months = Math.max(1, Math.round(value.loanYears * 12));
      const annualRate = Math.max(0, value.interestRate) / 100;
      const monthlyRate = annualRate / 12;

      if (principal <= 0) return 0;
      if (monthlyRate === 0) return principal / months;

      const pow = Math.pow(1 + monthlyRate, months);
      return (principal * monthlyRate * pow) / (pow - 1);
    });

    return {
      taxKind,
      taxRateLabelKey,
      downPaymentAmount,
      loanAmount,
      taxAmount,
      commissionAmount,
      realEstateCommissionAmount,
      feesAmount,
      upfrontTotal,
      estimatedMonthlyPayment
    };
  }

  /**
   * Installs model-level business rules.
   *
   * Current rule: `taxRate` defaults are automatically applied based on:
   * - `purchaseKind` (IVA vs ITP)
   * - `region` (ITP changes by region)
   *
   * Auto vs manual behavior:
   * - Starts in "auto" mode.
   * - If the user edits `taxRate` away from the default (with no kind/region change),
   *   switches to "manual" and stops auto-updating on region changes.
   * - If the user sets `taxRate` back to the default, switches back to "auto".
   * - Any change of `purchaseKind` resets the mode to "auto" and restores defaults.
   */
  setupBusinessRules(model: WritableSignal<HouseSavingsModel>): void {
    let previousPurchaseKind: PurchaseKind = model().purchaseKind;
    let previousRegion: Region = model().region;

    let taxRateMode: 'auto' | 'manual' = 'auto';

    effect(() => {
      const value = model();

      const defaultTaxRate =
        value.purchaseKind === 'firstHand' ? DEFAULT_IVA_RATE : DEFAULT_ITP_RATE[value.region];

      const purchaseKindChanged = value.purchaseKind !== previousPurchaseKind;
      const regionChanged = value.region !== previousRegion;
      const shouldAutoUpdateTaxRate = taxRateMode === 'auto' && regionChanged;

      let patch: Partial<HouseSavingsModel> | null = null;

      if (purchaseKindChanged) {
        // Switching between tax kinds changes semantics; revert to defaults.
        taxRateMode = 'auto';

        if (value.taxRate !== defaultTaxRate) {
          patch = { ...(patch ?? {}), taxRate: defaultTaxRate };
        }
      }

      if (shouldAutoUpdateTaxRate && value.taxRate !== defaultTaxRate) {
        patch = { ...(patch ?? {}), taxRate: defaultTaxRate };
      }

      // If we are in auto mode but the user changed taxRate (without a kind/region change),
      // stop auto-updating until it matches the default again.
      if (!purchaseKindChanged && !regionChanged) {
        if (taxRateMode === 'auto' && value.taxRate !== defaultTaxRate) {
          taxRateMode = 'manual';
        } else if (taxRateMode === 'manual' && value.taxRate === defaultTaxRate) {
          taxRateMode = 'auto';
        }
      }

      previousPurchaseKind = value.purchaseKind;
      previousRegion = value.region;

      if (patch) {
        model.update(m => ({ ...m, ...patch }));
      }
    });
  }
}
