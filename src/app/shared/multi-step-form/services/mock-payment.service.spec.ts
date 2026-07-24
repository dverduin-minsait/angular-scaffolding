import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { vi } from 'vitest';
import { MockPaymentService } from './mock-payment.service';
import { PaymentPayload, PaymentResult } from '../models/payment.model';

const basePayload: PaymentPayload = {
  amount: 99.99,
  currency: 'EUR',
  cardLastFour: '1234',
  expiryDate: '12/27',
  cardholderName: 'Test User',
};

describe('MockPaymentService', () => {
  let service: MockPaymentService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [MockPaymentService, provideZonelessChangeDetection()]
    }).compileComponents();
    service = TestBed.inject(MockPaymentService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('processPayment()', () => {
    describe('with a regular card (success path)', () => {
      it('should emit a successful PaymentResult after 1500ms delay', () => {
        let result: PaymentResult | undefined;
        service.processPayment({ ...basePayload, cardLastFour: '1234' })
          .subscribe(r => { result = r; });

        expect(result).toBeUndefined();
        vi.advanceTimersByTime(1500);

        expect(result).toBeDefined();
        expect(result!.success).toBe(true);
        expect(result!.transactionId).toMatch(/^TXN-/);
        expect(result!.error).toBeUndefined();
        expect(result!.timestamp).toBeGreaterThan(0);
      });

      it('should not emit before the 1500ms delay', () => {
        let result: PaymentResult | undefined;
        service.processPayment({ ...basePayload, cardLastFour: '1234' })
          .subscribe(r => { result = r; });

        vi.advanceTimersByTime(1499);
        expect(result).toBeUndefined();

        vi.advanceTimersByTime(1);
        expect(result).toBeDefined();
      });
    });

    describe('with card ending in 0000 (declined path)', () => {
      it('should emit a declined PaymentResult after 1500ms delay', () => {
        let result: PaymentResult | undefined;
        service.processPayment({ ...basePayload, cardLastFour: '0000' })
          .subscribe(r => { result = r; });

        vi.advanceTimersByTime(1500);

        expect(result).toBeDefined();
        expect(result!.success).toBe(false);
        expect(result!.transactionId).toBeUndefined();
        expect(result!.error).toBe('Card declined');
      });

      it('should not emit before 1500ms for declined card', () => {
        let result: PaymentResult | undefined;
        service.processPayment({ ...basePayload, cardLastFour: '0000' })
          .subscribe(r => { result = r; });

        vi.advanceTimersByTime(1499);
        expect(result).toBeUndefined();

        vi.advanceTimersByTime(1);
        expect(result).toBeDefined();
      });
    });

    describe('with card ending in 9999 (network error path)', () => {
      it('should throw a network error after 800ms', () => {
        let err: unknown;
        service.processPayment({ ...basePayload, cardLastFour: '9999' })
          .subscribe({ error: e => { err = e; } });

        vi.advanceTimersByTime(800);

        expect(err).toBeDefined();
        expect((err as { message: string }).message).toBe('Network error: payment gateway unreachable');
        expect((err as { code: string }).code).toBe('NETWORK_ERROR');
      });

      it('should not emit error before 800ms', () => {
        let err: unknown;
        service.processPayment({ ...basePayload, cardLastFour: '9999' })
          .subscribe({ error: e => { err = e; } });

        vi.advanceTimersByTime(799);
        expect(err).toBeUndefined();

        vi.advanceTimersByTime(1);
        expect(err).toBeDefined();
      });
    });

    it('should generate unique transaction IDs for successive payments', () => {
      const txns: string[] = [];
      service.processPayment(basePayload).subscribe(r => { if (r.transactionId) txns.push(r.transactionId); });
      vi.advanceTimersByTime(1500);
      service.processPayment(basePayload).subscribe(r => { if (r.transactionId) txns.push(r.transactionId); });
      vi.advanceTimersByTime(1500);

      expect(txns).toHaveLength(2);
      expect(txns[0]).not.toBe(txns[1]);
    });

    it('should handle cards with endings other than 0000/9999 as success', () => {
      let result: PaymentResult | undefined;
      service.processPayment({ ...basePayload, cardLastFour: '5678' })
        .subscribe(r => { result = r; });
      vi.advanceTimersByTime(1500);
      expect(result!.success).toBe(true);
    });
  });

  describe('validateCard()', () => {
    it('should return true for a regular card after 300ms delay', () => {
      let valid: boolean | undefined;
      service.validateCard('1234').subscribe(v => { valid = v; });

      vi.advanceTimersByTime(300);

      expect(valid).toBe(true);
    });

    it('should return false for card ending in 0000', () => {
      let valid: boolean | undefined;
      service.validateCard('0000').subscribe(v => { valid = v; });

      vi.advanceTimersByTime(300);

      expect(valid).toBe(false);
    });

    it('should return true for card ending in 9999 (only 0000 is invalid)', () => {
      let valid: boolean | undefined;
      service.validateCard('9999').subscribe(v => { valid = v; });

      vi.advanceTimersByTime(300);

      expect(valid).toBe(true);
    });

    it('should not emit before 300ms delay', () => {
      let valid: boolean | undefined;
      service.validateCard('1234').subscribe(v => { valid = v; });

      vi.advanceTimersByTime(299);
      expect(valid).toBeUndefined();

      vi.advanceTimersByTime(1);
      expect(valid).toBe(true);
    });
  });
});
