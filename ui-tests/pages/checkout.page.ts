import { Page, Locator, expect } from '@playwright/test';

export interface CardDetails {
  number: string;
  expiry: string;
  cvv: string;
  holder: string;
}

export class CheckoutPage {
  readonly page: Page;

  // Locators
  readonly cardNumberInput: Locator;
  readonly cardHolderInput: Locator;
  readonly expiryInput: Locator;
  readonly cvvInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  readonly confirmationNumber: Locator;
  readonly amountDisplay: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cardNumberInput = page.getByLabel('Card Number');
    this.cardHolderInput = page.getByLabel('Card Holder');
    this.expiryInput = page.getByLabel('Expiry Date');
    this.cvvInput = page.getByLabel('CVV');
    this.submitButton = page.getByRole('button', { name: 'Pay Now' });
    this.successMessage = page.getByTestId('payment-success');
    this.errorMessage = page.getByTestId('payment-error');
    this.confirmationNumber = page.getByTestId('confirmation-number');
    this.amountDisplay = page.getByTestId('amount-display');
  }

  async goto() {
    await this.page.goto('/checkout');
    await expect(this.submitButton).toBeVisible();
  }

  async enterCardDetails(card: CardDetails) {
    await this.cardNumberInput.fill(card.number);
    await this.cardHolderInput.fill(card.holder);
    await this.expiryInput.fill(card.expiry);
    await this.cvvInput.fill(card.cvv);
  }

  async submitPayment() {
    await this.submitButton.click();
  }

  async getConfirmationNumber(): Promise<string> {
    await expect(this.confirmationNumber).toBeVisible({ timeout: 10000 });
    return (await this.confirmationNumber.textContent()) ?? '';
  }

  async getErrorMessage(): Promise<string> {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
    return (await this.errorMessage.textContent()) ?? '';
  }

  async isCardNumberMasked(): Promise<boolean> {
    const value = await this.cardNumberInput.inputValue();
    return value.includes('*') || value.includes('•');
  }
}
