import { test } from '@playwright/test';
import { ChargeReader, ChargeErrorReader } from '../readers/charge.reader';
import { PaymentAssertions } from '../assertions/payment.assertions';

const BASE_URL = 'https://api.stripe.com/v1';
const SECRET_KEY = process.env.API_TOKEN!;

const headers = {
  Authorization: `Bearer ${SECRET_KEY}`,
  'Content-Type': 'application/x-www-form-urlencoded',
};

const TOKEN_SCENARIOS = [
  {
    id: 'visa',
    token: 'tok_visa',
    expectedBrand: 'visa',
    expectedLast4: '4242',
  },
  {
    id: 'mastercard',
    token: 'tok_mastercard',
    expectedBrand: 'mastercard',
    expectedLast4: '4444',
  },
  {
    id: 'amex',
    token: 'tok_amex',
    expectedBrand: 'amex',
    expectedLast4: '8431',
  },
];

const DECLINE_SCENARIOS = [
  {
    id: 'generic_decline',
    token: 'tok_chargeDeclined',
    expectedCode: 'card_declined',
  },
  {
    id: 'insufficient_funds',
    token: 'tok_chargeDeclinedInsufficientFunds',
    expectedCode: 'card_declined',
  },
  {
    id: 'expired_card',
    token: 'tok_chargeDeclinedExpiredCard',
    expectedCode: 'expired_card',
  },
];

test.describe('Stripe — Tokenization', () => {

  // ─── Successful Tokenizations ────────────────────────────────

  for (const scenario of TOKEN_SCENARIOS) {
    test(`should tokenize and charge — ${scenario.id}`, async ({ request }) => {
      // Arrange
      const form = {
        amount: '2000',
        currency: 'usd',
        source: scenario.token,
        description: `Tokenization test — ${scenario.id}`,
      };

      // Act
      const response = await request.post(`${BASE_URL}/charges`, { headers, form });
      const body = await response.json();
      console.log(body);
      const reader = new ChargeReader(body);

      // Assert
      await PaymentAssertions.assertSuccess(response);
      PaymentAssertions.assertChargeSucceeded(reader);
      PaymentAssertions.assertChargeCardBrand(reader, scenario.expectedBrand);
      PaymentAssertions.assertChargeCardLast4(reader, scenario.expectedLast4);
      PaymentAssertions.assertNoPANInResponse(body, scenario.token);
    });
  }

  // ─── Decline Scenarios ───────────────────────────────────────

  for (const scenario of DECLINE_SCENARIOS) {
    test(`should decline tokenized charge — ${scenario.id}`, async ({ request }) => {
      // Arrange
      const form = {
        amount: '2000',
        currency: 'usd',
        source: scenario.token,
        description: `Decline test — ${scenario.id}`,
      };

      // Act
      const response = await request.post(`${BASE_URL}/charges`, { headers, form });
      const body = await response.json();
      console.log(body);
      const errorReader = new ChargeErrorReader(body);

      // Assert
      await PaymentAssertions.assertDeclined(response);
      PaymentAssertions.assertChargeDeclineCode(errorReader, scenario.expectedCode);
    });
  }

  // ─── PAN Security ────────────────────────────────────────────

  test('should never expose raw card number in response', async ({ request }) => {
    // Arrange
    const form = {
      amount: '1000',
      currency: 'usd',
      source: 'tok_visa',
    };

    // Act
    const response = await request.post(`${BASE_URL}/charges`, { headers, form });
    const body = await response.json();

    // Assert — raw PAN must never appear
    await PaymentAssertions.assertSuccess(response);
    PaymentAssertions.assertNoPANInResponse(body, '4242424242424242');
  });

  // ─── Auth ────────────────────────────────────────────────────

  test('should return 401 with invalid API key', async ({ request }) => {
    // Act
    const response = await request.post(`${BASE_URL}/charges`, {
      headers: {
        Authorization: 'Bearer sk_test_invalid',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      form: { amount: '1000', currency: 'usd', source: 'tok_visa' },
    });

    // Assert
    await PaymentAssertions.assertUnauthorized(response);
  });

});