import { expect } from '@playwright/test';
import { CheckoutPage } from '../pages/checkout.page';

export class CheckoutAssertions {

  // ─── Page State ──────────────────────────────────────────────

  static async assertPageLoaded(checkout: CheckoutPage): Promise<void> {
    await expect(checkout.payButton).toBeVisible();
    await expect(checkout.cardNumberInput).toBeVisible();
    await expect(checkout.cardHolderInput).toBeVisible();
    await expect(checkout.expiryInput).toBeVisible();
    await expect(checkout.cvvInput).toBeVisible();
  }

  static async assertAmountDisplayed(checkout: CheckoutPage, expectedAmount: string): Promise<void> {
    const amount = await checkout.getAmountDisplay();
    expect(amount).toContain(expectedAmount);
  }

  // ─── Button State ─────────────────────────────────────────────

  static async assertPayButtonDisabled(checkout: CheckoutPage): Promise<void> {
    expect(
      await checkout.isPayButtonDisabled(),
      'Pay button should be disabled'
    ).toBe(true);
  }

  static async assertPayButtonEnabled(checkout: CheckoutPage): Promise<void> {
    expect(
      await checkout.isPayButtonDisabled(),
      'Pay button should be enabled'
    ).toBe(false);
  }

  // ─── Success State ────────────────────────────────────────────

  static async assertPaymentSucceeded(checkout: CheckoutPage): Promise<void> {
    await checkout.waitForSuccess();
    await expect(checkout.successMessage).toBeVisible();
  }

  static async assertConfirmationNumber(checkout: CheckoutPage): Promise<string> {
    const confirmationNumber = await checkout.getConfirmationNumber();
    expect(confirmationNumber, 'Confirmation number should start with ch_ or pi_').toMatch(/^(ch_|pi_)/);
    return confirmationNumber;
  }

  // ─── Error State ──────────────────────────────────────────────

  static async assertPaymentDeclined(checkout: CheckoutPage, expectedText: string): Promise<void> {
    await checkout.waitForError();
    const errorMessage = await checkout.getErrorMessage();
    expect(
      errorMessage.toLowerCase(),
      `Expected error to contain "${expectedText}"`
    ).toContain(expectedText.toLowerCase());
  }

  static async assertPayButtonReenabledAfterError(checkout: CheckoutPage): Promise<void> {
    await checkout.waitForError();
    await CheckoutAssertions.assertPayButtonEnabled(checkout);
  }

  // ─── Form Validation ─────────────────────────────────────────

  static async assertCardNumberError(checkout: CheckoutPage, expectedText: string): Promise<void> {
    await expect(checkout.cardNumberError).toBeVisible();
    const errorText = await checkout.cardNumberError.textContent();
    expect(errorText).toContain(expectedText);
  }

  static async assertCvvIsMasked(checkout: CheckoutPage): Promise<void> {
    expect(
      await checkout.isCvvMasked(),
      'CVV input should be masked (type=password)'
    ).toBe(true);
  }

  static async assertCardNumberFormatted(checkout: CheckoutPage, expectedFormatted: string): Promise<void> {
    const value = await checkout.cardNumberInput.inputValue();
    expect(value, `Expected formatted card number: ${expectedFormatted}`).toBe(expectedFormatted);
  }

  // ─── Security ────────────────────────────────────────────────

  static async assertNoPANInDOM(checkout: CheckoutPage, cardNumber: string): Promise<void> {
    const bodyText = await checkout.page.evaluate(() => document.body.innerHTML);
    expect(bodyText).not.toContain(cardNumber.replace(/\s/g, ''));
  }
}