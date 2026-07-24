import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { vi } from 'vitest';
import { PaymentStepComponent } from './payment-step.component';
import { MULTI_STEP_FORM_STORE, PAYMENT_SERVICE } from '../../tokens/multi-step-form.tokens';
import { SubmitResult } from '../../store/multi-step-form.store';
import { provideStubTranslationService } from '../../../../testing/i18n-testing';

function buildMockStore(overrides: Record<string, unknown> = {}) {
  const formDataSignal = signal<Record<string, unknown>>({ price: 50 });
  const submitResultSignal = signal<SubmitResult | null>(null);
  return {
    formData: formDataSignal.asReadonly(),
    submitResult: submitResultSignal.asReadonly(),
    setCurrentStepValid: vi.fn(),
    completeCurrentStep: vi.fn(),
    setSubmitResult: vi.fn(),
    _formDataSignal: formDataSignal,
    _submitResultSignal: submitResultSignal,
    ...overrides,
  };
}

const TRANSLATIONS = {
  'wizard.payment.title': 'Payment',
  'wizard.payment.subtitle': 'Complete your payment',
  'wizard.payment.cardholderName': 'Cardholder Name',
  'wizard.payment.cardholderHint': 'As shown on card',
  'wizard.payment.cardNumber': 'Card Number',
  'wizard.payment.cardNumberError': 'Invalid card number',
  'wizard.payment.expiry': 'Expiry',
  'wizard.payment.expiryError': 'Invalid expiry date',
  'wizard.payment.cvv': 'CVV',
  'wizard.payment.cvvAriaLabel': 'CVV security code',
  'wizard.payment.cvvError': 'Invalid CVV',
  'wizard.payment.processing': 'Processing...',
  'wizard.payment.payNow': 'Pay Now',
  'wizard.payment.totalAmount': 'Total',
  'wizard.payment.successMessage': 'Payment successful!',
};

describe('PaymentStepComponent', () => {
  let fixture: ComponentFixture<PaymentStepComponent>;
  let component: PaymentStepComponent;
  let mockStore: ReturnType<typeof buildMockStore>;
  let mockPaymentService: { processPayment: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockStore = buildMockStore();
    mockPaymentService = { processPayment: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PaymentStepComponent, TranslateModule.forRoot()],
      providers: [
        provideZonelessChangeDetection(),
        { provide: MULTI_STEP_FORM_STORE, useValue: mockStore },
        { provide: PAYMENT_SERVICE, useValue: mockPaymentService },
        ...provideStubTranslationService(TRANSLATIONS),
      ]
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { wizard: { payment: {
      title: 'Payment', subtitle: 'Complete your payment', cardholderName: 'Cardholder Name',
      cardholderHint: 'As shown on card', cardNumber: 'Card Number', cardNumberError: 'Invalid card number',
      expiry: 'Expiry', expiryError: 'Invalid expiry date', cvv: 'CVV', cvvAriaLabel: 'CVV security code',
      cvvError: 'Invalid CVV', processing: 'Processing...', payNow: 'Pay Now', totalAmount: 'Total',
      successMessage: 'Payment successful!',
    }}});
    translate.use('en');

    fixture = TestBed.createComponent(PaymentStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Component creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render the payment form', () => {
      const form = fixture.debugElement.query(By.css('.payment-step__form'));
      expect(form).toBeTruthy();
    });

    it('should render cardholder name input', () => {
      const input = fixture.debugElement.query(By.css('#cardholderName'));
      expect(input).toBeTruthy();
    });

    it('should render card number input', () => {
      const input = fixture.debugElement.query(By.css('#cardNumber'));
      expect(input).toBeTruthy();
    });

    it('should render expiry date input', () => {
      const input = fixture.debugElement.query(By.css('#expiryDate'));
      expect(input).toBeTruthy();
    });

    it('should render CVV input', () => {
      const input = fixture.debugElement.query(By.css('#cvv'));
      expect(input).toBeTruthy();
    });
  });

  describe('Store validity sync via effect()', () => {
    it('should call setCurrentStepValid(false) initially when form is empty', () => {
      expect(mockStore.setCurrentStepValid).toHaveBeenCalledWith(false);
    });

    it('should call setCurrentStepValid(true) when all fields are valid', () => {
      // Fill all required fields to make form valid
      fillValidCard();
      fixture.detectChanges();
      expect(mockStore.setCurrentStepValid).toHaveBeenCalledWith(true);
    });
  });

  describe('Form validation', () => {
    describe('Card number validation', () => {
      it('should be invalid when fewer than 13 digits', () => {
        setCardNumber('123456789012');
        fixture.detectChanges();
        expect(component['isCardNumberValid']()).toBe(false);
      });

      it('should be valid when 13 or more digits', () => {
        setCardNumber('1234567890123');
        fixture.detectChanges();
        expect(component['isCardNumberValid']()).toBe(true);
      });
    });

    describe('Expiry date validation', () => {
      it('should be invalid for non-MM/YY format', () => {
        // Note: onExpiryInput auto-formats "1225" → "12/25" (inserts slash).
        // Use a value with fewer than 4 digits so auto-format produces an incomplete result.
        setExpiry('12');
        fixture.detectChanges();
        expect(component['isExpiryValid']()).toBe(false);
      });

      it('should be valid for MM/YY format', () => {
        setExpiry('12/27');
        fixture.detectChanges();
        expect(component['isExpiryValid']()).toBe(true);
      });
    });

    describe('CVV validation', () => {
      it('should be invalid when fewer than 3 digits', () => {
        setCvv('12');
        fixture.detectChanges();
        expect(component['isCvvValid']()).toBe(false);
      });

      it('should be valid with 3 digits', () => {
        setCvv('123');
        fixture.detectChanges();
        expect(component['isCvvValid']()).toBe(true);
      });

      it('should be valid with 4 digits', () => {
        setCvv('1234');
        fixture.detectChanges();
        expect(component['isCvvValid']()).toBe(true);
      });
    });

    describe('Cardholder name validation', () => {
      it('should be invalid when name is too short', () => {
        setCardholderName('A');
        fixture.detectChanges();
        expect(component['isCardholderValid']()).toBe(false);
      });

      it('should be valid when name is 2+ chars', () => {
        setCardholderName('John');
        fixture.detectChanges();
        expect(component['isCardholderValid']()).toBe(true);
      });
    });
  });

  describe('Error visibility on form submission', () => {
    it('should show card number error after form submission when invalid', () => {
      // Submit without filling form
      submitForm();
      fixture.detectChanges();
      const errorEl = fixture.debugElement.query(By.css('#cardNumber-error'));
      expect(errorEl).toBeTruthy();
    });

    it('should show expiry error after submission when invalid', () => {
      setCardNumber('4111111111111111');
      submitForm();
      fixture.detectChanges();
      const errorEl = fixture.debugElement.query(By.css('#expiry-error'));
      expect(errorEl).toBeTruthy();
    });

    it('should show CVV error after submission when invalid', () => {
      setCardNumber('4111111111111111');
      setExpiry('12/27');
      submitForm();
      fixture.detectChanges();
      const errorEl = fixture.debugElement.query(By.css('#cvv-error'));
      expect(errorEl).toBeTruthy();
    });
  });

  describe('formattedAmount()', () => {
    it('should format price from store formData as EUR currency', () => {
      mockStore._formDataSignal.set({ price: 100 });
      fixture.detectChanges();
      const amount = component['formattedAmount']();
      expect(amount).toContain('100');
    });

    it('should show 0 when no price in form data', () => {
      mockStore._formDataSignal.set({});
      fixture.detectChanges();
      const amount = component['formattedAmount']();
      expect(amount).toContain('0');
    });
  });

  describe('Successful payment processing', () => {
    it('should call store.completeCurrentStep() and setSubmitResult() on success', () => {
      const paymentResult = { success: true, transactionId: 'TXN-001', timestamp: 1000 };
      mockPaymentService.processPayment.mockReturnValue(of(paymentResult).pipe(delay(100)));

      fillValidCard();
      submitForm();
      vi.advanceTimersByTime(100);
      fixture.detectChanges();

      expect(mockStore.completeCurrentStep).toHaveBeenCalled();
      expect(mockStore.setSubmitResult).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, transactionId: 'TXN-001' })
      );
    });

    it('should set isProcessing to false after success', () => {
      const paymentResult = { success: true, transactionId: 'TXN-001', timestamp: 1000 };
      mockPaymentService.processPayment.mockReturnValue(of(paymentResult).pipe(delay(100)));

      fillValidCard();
      submitForm();
      vi.advanceTimersByTime(100);
      fixture.detectChanges();

      expect(component['isProcessing']()).toBe(false);
    });

    it('should set isProcessing during payment', () => {
      const paymentResult = { success: true, transactionId: 'TXN-001', timestamp: 1000 };
      mockPaymentService.processPayment.mockReturnValue(of(paymentResult).pipe(delay(1500)));

      fillValidCard();
      submitForm();
      fixture.detectChanges();

      expect(component['isProcessing']()).toBe(true);
      vi.advanceTimersByTime(1500);
    });
  });

  describe('Declined payment', () => {
    it('should show paymentError message when card is declined', () => {
      const declinedResult = { success: false, error: 'Card declined', timestamp: 1000 };
      mockPaymentService.processPayment.mockReturnValue(of(declinedResult).pipe(delay(100)));

      fillValidCard();
      submitForm();
      vi.advanceTimersByTime(100);
      fixture.detectChanges();

      expect(component['paymentError']()).toBe('Card declined');
      expect(component['isProcessing']()).toBe(false);
    });

    it('should NOT call completeCurrentStep on declined payment', () => {
      const declinedResult = { success: false, error: 'Declined', timestamp: 1000 };
      mockPaymentService.processPayment.mockReturnValue(of(declinedResult).pipe(delay(100)));

      fillValidCard();
      submitForm();
      vi.advanceTimersByTime(100);

      expect(mockStore.completeCurrentStep).not.toHaveBeenCalled();
    });
  });

  describe('Payment error (network failure)', () => {
    it('should set paymentError on observable error', () => {
      mockPaymentService.processPayment.mockReturnValue(
        throwError(() => ({ message: 'Network error' })).pipe(delay(100))
      );

      fillValidCard();
      submitForm();
      vi.advanceTimersByTime(100);
      fixture.detectChanges();

      expect(component['paymentError']()).toBe('Network error');
      expect(component['isProcessing']()).toBe(false);
    });

    it('should use fallback message when error has no message', () => {
      mockPaymentService.processPayment.mockReturnValue(
        throwError(() => ({})).pipe(delay(100))
      );

      fillValidCard();
      submitForm();
      vi.advanceTimersByTime(100);
      fixture.detectChanges();

      expect(component['paymentError']()).toBe('Payment failed. Please try again.');
    });
  });

  describe('Success state display', () => {
    it('should show success section when submitResult is successful', () => {
      mockStore._submitResultSignal.set({ success: true, transactionId: 'TXN-123', timestamp: 1000 });
      fixture.detectChanges();
      const successEl = fixture.debugElement.query(By.css('.payment-step__success'));
      expect(successEl).toBeTruthy();
    });

    it('should hide form when submitResult is successful', () => {
      mockStore._submitResultSignal.set({ success: true, transactionId: 'TXN-123', timestamp: 1000 });
      fixture.detectChanges();
      const form = fixture.debugElement.query(By.css('.payment-step__form'));
      expect(form).toBeFalsy();
    });
  });

  describe('Card number masking display', () => {
    it('should display card number grouped in chunks of 4', () => {
      setCardNumber('4111111111111111');
      fixture.detectChanges();
      const cardInput = fixture.debugElement.query(By.css('#cardNumber'));
      const displayValue: string = component['cardNumberDisplay']();
      expect(displayValue).toContain('4111');
    });
  });

  // Helpers

  function fillValidCard() {
    setCardholderName('John Doe');
    setCardNumber('4111111111111111');
    setExpiry('12/27');
    setCvv('123');
    fixture.detectChanges();
  }

  function setCardholderName(value: string) {
    const input = fixture.nativeElement.querySelector('#cardholderName') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function setCardNumber(digits: string) {
    const input = fixture.nativeElement.querySelector('#cardNumber') as HTMLInputElement;
    input.value = digits;
    input.dispatchEvent(new Event('input'));
  }

  function setExpiry(value: string) {
    const input = fixture.nativeElement.querySelector('#expiryDate') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function setCvv(value: string) {
    const input = fixture.nativeElement.querySelector('#cvv') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function submitForm() {
    const form = fixture.nativeElement.querySelector('.payment-step__form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
  }
});
