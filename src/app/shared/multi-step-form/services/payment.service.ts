import { Observable } from 'rxjs';
import { PaymentPayload, PaymentResult } from '../models/payment.model';

/**
 * Abstract payment service contract.
 * Provide a concrete implementation via the PAYMENT_SERVICE token.
 */
export abstract class PaymentService {
  abstract processPayment(payload: PaymentPayload): Observable<PaymentResult>;
  abstract validateCard(cardLastFour: string): Observable<boolean>;
}
