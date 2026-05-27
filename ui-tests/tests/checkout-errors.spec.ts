import { test } from '@playwright/test';
import { CheckoutPage } from '../pages/checkout.page';
import { CheckoutAssertions } from '../assertions/checkout.assertions';
import cardsData from '../data/cards.json';

test.describe('Checkout UI — Error States', () => {

  for (const card of cardsData.declined) {
    test(`should show error for — ${card.id}`, async ({ page }) => {
      // Arrange
      const checkout = new CheckoutPage(page);
      await checkout.goto();

      // Act
      await checkout.enterCardDetails(card);
      await checkout.submitPayment();

      // Assert
      await CheckoutAssertions.assertPaymentDeclined(checkout, card.expectedError);
    });
  }

  test('should re-enable Pay Now button after decline', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act
    await checkout.enterCardDetails(cardsData.declined[0]);
    await checkout.submitPayment();

    // Assert
    await CheckoutAssertions.assertPayButtonReenabledAfterError(checkout);
  });

  test('should clear previous success before new attempt', async ({ page }) => {
    // Arrange
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Act — first attempt declined
    await checkout.enterCardDetails(cardsData.declined[0]);
    await checkout.submitPayment();
    await checkout.waitForError();

    // Assert — success message not visible
    const successVisible = await checkout.successMessage.isVisible();
    test.expect(successVisible).toBe(false);
  });

});