export interface PaymentIntentResponse {
  id: string;
  object: string;
  amount: number;
  amount_received: number;
  amount_capturable: number;
  currency: string;
  status: string;
  client_secret: string;
  confirmation_method: string;
  capture_method: string;
  payment_method: string | null;
  payment_method_types: string[];
  latest_charge: string | null;
  metadata: Record<string, string>;
  livemode: boolean;
  created: number;
  last_payment_error: {
    code: string;
    decline_code?: string;
    message: string;
    type: string;
  } | null;
}

export interface PaymentIntentErrorResponse {
  error: {
    code: string;
    message: string;
    param?: string;
    type: string;
  };
}

export class PaymentIntentReader {
  constructor(private readonly body: PaymentIntentResponse) {}

  getId(): string {
    return this.body.id;
  }

  getAmount(): number {
    return this.body.amount;
  }

  getAmountReceived(): number {
    return this.body.amount_received;
  }

  getStatus(): string {
    return this.body.status;
  }

  getCurrency(): string {
    return this.body.currency;
  }

  getClientSecret(): string {
    return this.body.client_secret;
  }

  getPaymentMethod(): string | null {
    return this.body.payment_method;
  }

  getPaymentMethodTypes(): string[] {
    return this.body.payment_method_types;
  }

  getLatestCharge(): string | null {
    return this.body.latest_charge;
  }

  isLiveMode(): boolean {
    return this.body.livemode;
  }

  isSucceeded(): boolean {
    return this.body.status === 'succeeded';
  }

  requiresPaymentMethod(): boolean {
    return this.body.status === 'requires_payment_method';
  }

  requiresConfirmation(): boolean {
    return this.body.status === 'requires_confirmation';
  }

  getLastPaymentError(): PaymentIntentResponse['last_payment_error'] {
    return this.body.last_payment_error;
  }

  getMetadata(): Record<string, string> {
    return this.body.metadata;
  }

  getCreatedAt(): Date {
    return new Date(this.body.created * 1000);
  }

  toSummary(): string {
    return `PaymentIntent ${this.body.id} | ${this.body.amount} ${this.body.currency.toUpperCase()} | ${this.body.status}`;
  }
}

export class PaymentIntentErrorReader {
  constructor(private readonly body: PaymentIntentErrorResponse) {}

  getCode(): string {
    return this.body.error.code;
  }

  getMessage(): string {
    return this.body.error.message;
  }

  getParam(): string | undefined {
    return this.body.error.param;
  }

  getType(): string {
    return this.body.error.type;
  }
}