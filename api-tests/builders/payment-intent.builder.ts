export class PaymentIntentBuilder {
  private payload: Record<string, string> = {
    amount: '2000',
    currency: 'usd',
    'payment_method_types[]': 'card',
  };

  withAmount(amount: number): this {
    this.payload['amount'] = amount.toString();
    return this;
  }

  withCurrency(currency: string): this {
    this.payload['currency'] = currency;
    return this;
  }

  withPaymentMethod(paymentMethod: string): this {
    this.payload['payment_method'] = paymentMethod;
    return this;
  }

  withDescription(description: string): this {
    this.payload['description'] = description;
    return this;
  }

  withMetadata(metadata: Record<string, string>): this {
    Object.entries(metadata).forEach(([key, value]) => {
      this.payload[`metadata[${key}]`] = value;
    });
    return this;
  }

  withConfirm(): this {
    this.payload['confirm'] = 'true';
    return this;
  }

  withoutAmount(): this {
    delete this.payload['amount'];
    return this;
  }

  withoutCurrency(): this {
    delete this.payload['currency'];
    return this;
  }

  // Preset scenarios
  asConfirmedVisa(): this {
    this.payload['payment_method'] = 'pm_card_visa';
    this.payload['confirm'] = 'true';
    return this;
  }

  asConfirmedMastercard(): this {
    this.payload['payment_method'] = 'pm_card_mastercard';
    this.payload['confirm'] = 'true';
    return this;
  }

  build(): Record<string, string> {
    return { ...this.payload };
  }
}