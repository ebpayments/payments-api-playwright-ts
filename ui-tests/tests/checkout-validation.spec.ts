import { test } from '@playwright/test';
import { CheckoutPage } from '../pages/checkout.page';
import { CheckoutAssertions } from '../assertions/checkout.assertions';
import cardsData from '../data/cards.json';

test.describe('Checkout UI — Form Validation', () => {

  test('should show error for incomplete card number', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act — enter incomplete card number
    await checkout.cardNumberInput.fill(cardsData.invalid[0].number);
    await checkout.expiryInput.click(); // trigger blur

    // Assert
    await CheckoutAssertions.assertCardNumberError(checkout, cardsData.invalid[0].expectedError);
  });

  test('should mask CVV input', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Assert
    await CheckoutAssertions.assertCvvIsMasked(checkout);
  });

  test('should keep Pay Now button disabled when card number is missing', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act — fill everything except card number
    await checkout.cardHolderInput.fill('Test User');
    await checkout.expiryInput.fill('12/26');
    await checkout.cvvInput.fill('123');

    // Assert
    await CheckoutAssertions.assertPayButtonDisabled(checkout);
  });

  test('should keep Pay Now button disabled when holder is missing', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act — fill everything except holder
    await checkout.cardNumberInput.fill('4242424242424242');
    await checkout.expiryInput.fill('12/26');
    await checkout.cvvInput.fill('123');

    // Assert
    await CheckoutAssertions.assertPayButtonDisabled(checkout);
  });

  test('should format card number with spaces', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act
    await checkout.cardNumberInput.fill('4242424242424242');

    // Assert
    await CheckoutAssertions.assertCardNumberFormatted(checkout, '4242 4242 4242 4242');
  });

  test('should not expose PAN in DOM after entry', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act
    await checkout.enterCardDetails(cardsData.success[0]);

    // Assert — raw PAN must not appear in DOM
    await CheckoutAssertions.assertNoPANInDOM(checkout, cardsData.success[0].number);
  });

});