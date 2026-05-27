import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../pages/checkout.page';
import { TEST_CARDS } from '../../fixtures/test-data';

test.describe('Checkout — Happy Path', () => {
  test('should complete payment with valid Visa card', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act
    await checkout.enterCardDetails(TEST_CARDS.VISA_SUCCESS);
    await checkout.submitPayment();

    // Assert
    const confirmationNumber = await checkout.getConfirmationNumber();
    expect(confirmationNumber).toBeTruthy();
    expect(confirmationNumber).toMatch(/^TXN-\w+/);
  });

  test('should complete payment with valid Mastercard', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act
    await checkout.enterCardDetails(TEST_CARDS.MASTERCARD_SUCCESS);
    await checkout.submitPayment();

    // Assert
    await expect(checkout.successMessage).toBeVisible();
  });
});

test.describe('Checkout — Error States', () => {
  test('should show decline message for declined card', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act
    await checkout.enterCardDetails(TEST_CARDS.DECLINED);
    await checkout.submitPayment();

    // Assert
    const errorMessage = await checkout.getErrorMessage();
    expect(errorMessage.toLowerCase()).toContain('declined');
  });

  test('should show error for expired card', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act
    await checkout.enterCardDetails(TEST_CARDS.EXPIRED);
    await checkout.submitPayment();

    // Assert
    const errorMessage = await checkout.getErrorMessage();
    expect(errorMessage.toLowerCase()).toContain('expired');
  });

  test('should show insufficient funds message', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act
    await checkout.enterCardDetails(TEST_CARDS.INSUFFICIENT_FUNDS);
    await checkout.submitPayment();

    // Assert
    const errorMessage = await checkout.getErrorMessage();
    expect(errorMessage.toLowerCase()).toContain('insufficient');
  });
});

test.describe('Checkout — Form Validation', () => {
  test('should disable submit button when card number is empty', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Assert — button disabled before entering data
    await expect(checkout.submitButton).toBeDisabled();
  });

  test('should show validation error for invalid card number format', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act
    await checkout.cardNumberInput.fill('1234');
    await checkout.cvvInput.focus(); // trigger blur validation

    // Assert
    await expect(page.getByTestId('card-number-error')).toBeVisible();
  });

  test('should mask CVV input', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act
    await checkout.cvvInput.fill('123');

    // Assert — CVV field should be password type
    const inputType = await checkout.cvvInput.getAttribute('type');
    expect(inputType).toBe('password');
  });
});
