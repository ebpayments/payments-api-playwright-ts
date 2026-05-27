import { Page, Locator, expect } from '@playwright/test';

export interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
  holder: string;
}

// Stripe test tokens mapped to card numbers
const CARD_TOKEN_MAP: Record<string, string> = {
  '4242424242424242': 'tok_visa',
  '5555555555554444': 'tok_mastercard',
  '4000000000000002': 'tok_chargeDeclined',
  '4000000000009995': 'tok_chargeDeclinedInsufficientFunds',
  '4000000000000069': 'tok_chargeDeclinedExpiredCard',
};

export class CheckoutPage {
  readonly page: Page;

  readonly cardHolderInput: Locator;
  readonly cardNumberInput: Locator;
  readonly expiryInput: Locator;
  readonly cvvInput: Locator;
  readonly stripeToken: Locator;
  readonly payButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly confirmationNumber: Locator;
  readonly amountDisplay: Locator;
  readonly cardNumberError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cardHolderInput = page.getByLabel('Card Holder');
    this.cardNumberInput = page.getByLabel('Card Number');
    this.expiryInput = page.getByLabel('Expiry Date');
    this.cvvInput = page.getByLabel('CVV');
    this.stripeToken = page.getByTestId('stripe-token');
    this.payButton = page.getByTestId('pay-button');
    this.successMessage = page.getByTestId('payment-success');
    this.errorMessage = page.getByTestId('payment-error');
    this.confirmationNumber = page.getByTestId('confirmation-number');
    this.amountDisplay = page.getByTestId('amount-display');
    this.cardNumberError = page.getByTestId('card-number-error');
  }

  async goto() {
    await this.page.goto('http://localhost:3000');
    await expect(this.payButton).toBeVisible();
  }

  async enterCardDetails(card: CardDetails) {
    // Set holder name
    await this.cardHolderInput.fill(card.holder);

    // Map card number to Stripe token and set hidden field
    const token = CARD_TOKEN_MAP[card.number] || 'tok_visa';
    await this.stripeToken.evaluate((el: HTMLInputElement, value) => {
      el.value = value;
      el.dispatchEvent(new Event('change'));
    }, token);

    // Also fill visible fields for UI validation tests
    await this.cardNumberInput.fill(card.number);
    await this.expiryInput.fill(card.expiry);
    await this.cvvInput.fill(card.cvv);
  }

  async submitPayment() {
    await this.payButton.click();
  }

  async waitForSuccess() {
    await expect(this.successMessage).toBeVisible({ timeout: 15000 });
  }

  async waitForError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 15000 });
  }

  async getConfirmationNumber(): Promise<string> {
    await this.waitForSuccess();
    return (await this.confirmationNumber.textContent()) ?? '';
  }

  async getErrorMessage(): Promise<string> {
    await this.waitForError();
    return (await this.errorMessage.textContent()) ?? '';
  }

  async getAmountDisplay(): Promise<string> {
    return (await this.amountDisplay.textContent()) ?? '';
  }

  async isPayButtonDisabled(): Promise<boolean> {
    return await this.payButton.isDisabled();
  }

  async isCvvMasked(): Promise<boolean> {
    const inputType = await this.cvvInput.getAttribute('type');
    return inputType === 'password';
  }
}