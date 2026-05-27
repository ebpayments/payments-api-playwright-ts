import { test } from '@playwright/test';
import { CheckoutPage } from '../pages/checkout.page';
import { CheckoutAssertions } from '../assertions/checkout.assertions';
import cardsData from '../data/cards.json';

test.describe('Checkout UI — Happy Path', () => {

  test('should display checkout page correctly', async ({ page }) => {
    // Arrange & Act
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Assert
    await CheckoutAssertions.assertPageLoaded(checkout);
    await CheckoutAssertions.assertAmountDisplayed(checkout, '$20.00');
    await CheckoutAssertions.assertPayButtonDisabled(checkout);
  });

  test('should enable Pay Now button when all fields are filled', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Assert — disabled initially
    await CheckoutAssertions.assertPayButtonDisabled(checkout);

    // Act
    await checkout.enterCardDetails(cardsData.success[0]);

    // Assert — enabled after fill
    await CheckoutAssertions.assertPayButtonEnabled(checkout);
  });

  for (const card of cardsData.success) {
    test(`should complete payment successfully — ${card.id}`, async ({ page }) => {
      // Arrange
      const checkout = new CheckoutPage(page);
      await checkout.goto();

      // Act
      await checkout.enterCardDetails(card);
      await checkout.submitPayment();

      // Assert
      await CheckoutAssertions.assertPaymentSucceeded(checkout);
      await CheckoutAssertions.assertConfirmationNumber(checkout);
    });
  }

});