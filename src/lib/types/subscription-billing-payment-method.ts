export interface BillingPaymentMethodPayload {
  cardholderName: string;
  cardNumber: string;
  exp: string;
  cvc: string;
  default: boolean;
}

export interface BillingPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp: string;
  default: boolean;
}

export interface BillingPaymentMethodsResponse {
  data: BillingPaymentMethod[];
}
