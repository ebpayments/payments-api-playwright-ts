export interface ChargePayload {
  amount: string;
  currency: string;
  source: string;
  description?: string;
  metadata?: Record<string, string>;
}

export class ChargeBuilder {
  private payload: ChargePayload = {
    amount: '2000',
    currency: 'usd',
    source: 'tok_visa',
  };

  withAmount(amount: number): this {
    this.payload.amount = amount.toString();
    return this;
  }

  withCurrency(currency: string): this {
    this.payload.currency = currency;
    return this;
  }

  withSource(source: string): this {
    this.payload.source = source;
    return this;
  }

  withDescription(description: string): this {
    this.payload.description = description;
    return this;
  }

  withMetadata(metadata: Record<string, string>): this {
    this.payload.metadata = metadata;
    return this;
  }

  // Preset scenarios
  asDeclined(): this {
    this.payload.source = 'tok_chargeDeclined';
    return this;
  }

  asInsufficientFunds(): this {
    this.payload.source = 'tok_chargeDeclinedInsufficientFunds';
    return this;
  }

  asExpiredCard(): this {
    this.payload.source = 'tok_chargeDeclinedExpiredCard';
    return this;
  }

  asMastercard(): this {
    this.payload.source = 'tok_mastercard';
    return this;
  }

  asAmex(): this {
    this.payload.source = 'tok_amex';
    return this;
  }

  build(): Record<string, string> {
    const form: Record<string, string> = {
      amount: this.payload.amount,
      currency: this.payload.currency,
      source: this.payload.source,
    };

    if (this.payload.description) {
      form['description'] = this.payload.description;
    }

    if (this.payload.metadata) {
      Object.entries(this.payload.metadata).forEach(([key, value]) => {
        form[`metadata[${key}]`] = value;
      });
    }

    return form;
  }
}