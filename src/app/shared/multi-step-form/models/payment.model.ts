/** Data required to initiate a payment. */
export interface PaymentPayload {
  amount: number;
  currency: string;
  /** Last four digits of the card (never store full number). */
  cardLastFour: string;
  expiryDate: string;
  cardholderName: string;
}

/** Result returned by the payment service after processing. */
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  timestamp: number;
}
