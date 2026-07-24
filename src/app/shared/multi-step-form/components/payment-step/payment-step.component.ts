import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '@ngx-translate/core';
import { MULTI_STEP_FORM_STORE, PAYMENT_SERVICE } from '../../tokens/multi-step-form.tokens';
import { PaymentPayload } from '../../models/payment.model';
import { ButtonDirective } from '../../../directives/button.directive';

/** Masks all but the last 4 chars. */
function maskCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.slice(-4).padStart(digits.length, '•').replace(/(.{4})/g, '$1 ').trim();
}

@Component({
  selector: 'app-payment-step',
  standalone: true,
  imports: [TranslatePipe, ButtonDirective],
  template: `
    <div class="payment-step">
      <h2 class="payment-step__title">{{ 'wizard.payment.title' | translate }}</h2>
      <p class="payment-step__subtitle">{{ 'wizard.payment.subtitle' | translate }}</p>

      @if (store.submitResult()?.success) {
        <div class="payment-step__success" role="status" aria-live="polite">
          <p>{{ 'wizard.payment.successMessage' | translate: { id: store.submitResult()?.transactionId } }}</p>
        </div>
      } @else {
        <form class="payment-step__form" (submit)="processPayment($event)" novalidate>
          <div class="payment-step__amount" aria-live="polite">
            <span class="payment-step__amount-label">{{ 'wizard.payment.totalAmount' | translate }}</span>
            <span class="payment-step__amount-value">{{ formattedAmount() }}</span>
          </div>

          <div class="payment-step__field" [class.payment-step__field--error]="showCardError()">
            <label class="payment-step__label" for="cardholderName">
              {{ 'wizard.payment.cardholderName' | translate }} *
            </label>
            <input
              id="cardholderName"
              type="text"
              class="payment-step__control"
              autocomplete="cc-name"
              [value]="cardholderName()"
              (input)="onCardholderNameInput($event)"
              [attr.aria-invalid]="showCardholderError() || null"
              aria-required="true"
              aria-describedby="cardholderName-hint" />
            <span id="cardholderName-hint" class="payment-step__hint">
              {{ 'wizard.payment.cardholderHint' | translate }}
            </span>
          </div>

          <div class="payment-step__field" [class.payment-step__field--error]="showCardError()">
            <label class="payment-step__label" for="cardNumber">
              {{ 'wizard.payment.cardNumber' | translate }} *
            </label>
            <input
              id="cardNumber"
              type="text"
              inputmode="numeric"
              class="payment-step__control payment-step__control--card"
              autocomplete="cc-number"
              maxlength="19"
              [value]="cardNumberDisplay()"
              (input)="onCardNumberInput($event)"
              [attr.aria-invalid]="showCardError() || null"
              aria-required="true"
              aria-describedby="cardNumber-error" />
            @if (showCardError()) {
              <span id="cardNumber-error" class="payment-step__error" role="alert">
                {{ 'wizard.payment.cardNumberError' | translate }}
              </span>
            }
          </div>

          <div class="payment-step__row">
            <div class="payment-step__field">
              <label class="payment-step__label" for="expiryDate">
                {{ 'wizard.payment.expiry' | translate }} *
              </label>
              <input
                id="expiryDate"
                type="text"
                inputmode="numeric"
                class="payment-step__control"
                autocomplete="cc-exp"
                placeholder="MM/YY"
                maxlength="5"
                [value]="expiryDate()"
                (input)="onExpiryInput($event)"
                [attr.aria-invalid]="showExpiryError() || null"
                aria-required="true"
                aria-describedby="expiry-error" />
              @if (showExpiryError()) {
                <span id="expiry-error" class="payment-step__error" role="alert">
                  {{ 'wizard.payment.expiryError' | translate }}
                </span>
              }
            </div>

            <div class="payment-step__field">
              <label class="payment-step__label" for="cvv">
                {{ 'wizard.payment.cvv' | translate }} *
              </label>
              <input
                id="cvv"
                type="text"
                inputmode="numeric"
                class="payment-step__control"
                autocomplete="cc-csc"
                maxlength="4"
                [value]="cvv()"
                (input)="onCvvInput($event)"
                [attr.aria-invalid]="showCvvError() || null"
                aria-required="true"
                aria-describedby="cvv-error"
                [attr.aria-label]="'wizard.payment.cvvAriaLabel' | translate" />
              @if (showCvvError()) {
                <span id="cvv-error" class="payment-step__error" role="alert">
                  {{ 'wizard.payment.cvvError' | translate }}
                </span>
              }
            </div>
          </div>

          @if (paymentError()) {
            <div class="payment-step__alert" role="alert" aria-live="assertive">
              {{ paymentError() }}
            </div>
          }

          <button
            type="submit"
            appButton
            class="payment-step__submit"
            [disabled]="!isFormValid() || isProcessing()"
            [attr.aria-disabled]="!isFormValid() || isProcessing() || null"
            [attr.aria-busy]="isProcessing() || null">
            @if (isProcessing()) {
              {{ 'wizard.payment.processing' | translate }}
            } @else {
              {{ 'wizard.payment.payNow' | translate: { amount: formattedAmount() } }}
            }
          </button>
        </form>
      }
    </div>
  `,
  styleUrl: './payment-step.component.scss',
})
export class PaymentStepComponent {
  protected readonly store = inject(MULTI_STEP_FORM_STORE);
  private readonly paymentService = inject(PAYMENT_SERVICE);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cardholderName = signal('');
  protected readonly cardNumber = signal('');
  protected readonly expiryDate = signal('');
  protected readonly cvv = signal('');
  protected readonly isProcessing = signal(false);
  protected readonly paymentError = signal<string | null>(null);
  protected readonly formSubmitted = signal(false);

  protected readonly cardNumberDisplay = computed(() =>
    this.cardNumber().replace(/(\d{4})(?=\d)/g, '$1 ')
  );

  protected readonly isCardNumberValid = computed(
    () => this.cardNumber().replace(/\D/g, '').length >= 13
  );
  protected readonly isExpiryValid = computed(() => /^\d{2}\/\d{2}$/.test(this.expiryDate()));
  protected readonly isCvvValid = computed(() => this.cvv().length >= 3);
  protected readonly isCardholderValid = computed(() => this.cardholderName().trim().length >= 2);

  protected readonly isFormValid = computed(
    () =>
      this.isCardNumberValid() &&
      this.isExpiryValid() &&
      this.isCvvValid() &&
      this.isCardholderValid()
  );

  protected readonly showCardError = computed(
    () => this.formSubmitted() && !this.isCardNumberValid()
  );
  protected readonly showExpiryError = computed(
    () => this.formSubmitted() && !this.isExpiryValid()
  );
  protected readonly showCvvError = computed(
    () => this.formSubmitted() && !this.isCvvValid()
  );
  protected readonly showCardholderError = computed(
    () => this.formSubmitted() && !this.isCardholderValid()
  );

  protected readonly formattedAmount = computed(() => {
    const data = this.store.formData();
    const amount = (data['price'] as number) ?? 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(amount);
  });

  constructor() {
    // Keep store validity in sync with payment form validity
    effect(() => {
      this.store.setCurrentStepValid(this.isFormValid());
    });
  }

  protected onCardholderNameInput(event: Event): void {
    this.cardholderName.set((event.target as HTMLInputElement).value);
    this.paymentError.set(null);
  }

  protected onCardNumberInput(event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 16);
    this.cardNumber.set(digits);
    this.paymentError.set(null);
  }

  protected onExpiryInput(event: Event): void {
    let val = (event.target as HTMLInputElement).value.replace(/\D/g, '');
    if (val.length >= 3) val = val.slice(0, 2) + '/' + val.slice(2, 4);
    (event.target as HTMLInputElement).value = val;
    this.expiryDate.set(val);
    this.paymentError.set(null);
  }

  protected onCvvInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
    this.cvv.set(val);
    this.paymentError.set(null);
  }

  protected processPayment(event: Event): void {
    event.preventDefault();
    this.formSubmitted.set(true);
    if (!this.isFormValid()) return;

    const data = this.store.formData();
    const payload: PaymentPayload = {
      amount: (data['price'] as number) ?? 0,
      currency: 'EUR',
      cardLastFour: this.cardNumber().slice(-4),
      expiryDate: this.expiryDate(),
      cardholderName: this.cardholderName().trim(),
    };

    this.isProcessing.set(true);
    this.paymentError.set(null);

    this.paymentService
      .processPayment(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.isProcessing.set(false);
          if (result.success) {
            this.store.completeCurrentStep({ paymentResult: result } as Record<string, unknown>);
            this.store.setSubmitResult({
              success: true,
              transactionId: result.transactionId,
              timestamp: result.timestamp,
            });
          } else {
            this.paymentError.set(result.error ?? 'Payment declined');
          }
        },
        error: (err: unknown) => {
          this.isProcessing.set(false);
          const e = err as { message?: string };
          this.paymentError.set(e.message ?? 'Payment failed. Please try again.');
        },
      });
  }
}
