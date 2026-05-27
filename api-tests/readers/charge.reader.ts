export interface ChargeResponse {
  id: string;
  object: string;
  amount: number;
  amount_captured: number;
  amount_refunded: number;
  currency: string;
  status: string;
  paid: boolean;
  captured: boolean;
  refunded: boolean;
  description: string | null;
  failure_code: string | null;
  failure_message: string | null;
  outcome: {
    network_status: string;
    reason: string | null;
    risk_level: string;
    risk_score: number;
    seller_message: string;
    type: string;
    decline_code?: string;
  };
  payment_method_details: {
    card: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
      funding: string;
      country: string;
    };
    type: string;
  };
  metadata: Record<string, string>;
  livemode: boolean;
  created: number;
}

export interface ChargeErrorResponse {
  error: {
    code: string;
    decline_code?: string;
    message: string;
    type: string;
    param?: string;
  };
}

export class ChargeReader {
  constructor(private readonly body: ChargeResponse) {}

  getId(): string {
    return this.body.id;
  }

  getAmount(): number {
    return this.body.amount;
  }

  getStatus(): string {
    return this.body.status;
  }

  getCurrency(): string {
    return this.body.currency;
  }

  isPaid(): boolean {
    return this.body.paid;
  }

  isCaptured(): boolean {
    return this.body.captured;
  }

  isRefunded(): boolean {
    return this.body.refunded;
  }

  isLiveMode(): boolean {
    return this.body.livemode;
  }

  getCardBrand(): string {
    return this.body.payment_method_details.card.brand;
  }

  getCardLast4(): string {
    return this.body.payment_method_details.card.last4;
  }

  getRiskLevel(): string {
    return this.body.outcome.risk_level;
  }

  getRiskScore(): number {
    return this.body.outcome.risk_score;
  }

  getFailureCode(): string | null {
    return this.body.failure_code;
  }

  getMetadata(): Record<string, string> {
    return this.body.metadata;
  }

  getCreatedAt(): Date {
    return new Date(this.body.created * 1000);
  }

  toSummary(): string {
    return `Charge ${this.body.id} | ${this.body.amount} ${this.body.currency.toUpperCase()} | ${this.body.status} | ${this.getCardBrand()} ****${this.getCardLast4()}`;
  }
}

export class ChargeErrorReader {
  constructor(private readonly body: ChargeErrorResponse) {}

  getCode(): string {
    return this.body.error.code;
  }

  getDeclineCode(): string | undefined {
    return this.body.error.decline_code;
  }

  getMessage(): string {
    return this.body.error.message;
  }

  getType(): string {
    return this.body.error.type;
  }

  getParam(): string | undefined {
    return this.body.error.param;
  }
}