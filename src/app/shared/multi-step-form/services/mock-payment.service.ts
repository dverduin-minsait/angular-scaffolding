import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import { PaymentPayload, PaymentResult } from '../models/payment.model';
import { PaymentService } from './payment.service';

/**
 * Mock payment service for development and testing.
 * Card ending in '0000' simulates a declined payment.
 * Card ending in '9999' simulates a network error.
 * All other cards succeed after a simulated 1500ms delay.
 */
@Injectable()
export class MockPaymentService extends PaymentService {
  processPayment(payload: PaymentPayload): Observable<PaymentResult> {
    const last4 = payload.cardLastFour;

    if (last4 === '9999') {
      return timer(800).pipe(
        mergeMap(() => throwError(() => ({
          message: 'Network error: payment gateway unreachable',
          code: 'NETWORK_ERROR',
        })))
      );
    }

    const success = last4 !== '0000';
    const result: PaymentResult = {
      success,
      transactionId: success ? `TXN-${Date.now()}` : undefined,
      error: success ? undefined : 'Card declined',
      timestamp: Date.now(),
    };

    return of(result).pipe(delay(1500));
  }

  validateCard(cardLastFour: string): Observable<boolean> {
    return of(cardLastFour !== '0000').pipe(delay(300));
  }
}
