import { test } from '@playwright/test';
import { ChargeReader, ChargeErrorReader } from '../readers/charge.reader';
import { PaymentAssertions } from '../assertions/payment.assertions';
import { ReporterHelper } from '../../utils/reporter.helper';

const BASE_URL = 'https://api.stripe.com/v1';
const SECRET_KEY = process.env.API_TOKEN!;

const headers = {
  Authorization: `Bearer ${SECRET_KEY}`,
  'Content-Type': 'application/x-www-form-urlencoded',
};

const TOKEN_SCENARIOS = [
  { id: 'visa', token: 'tok_visa', expectedBrand: 'visa', expectedLast4: '4242' },
  { id: 'mastercard', token: 'tok_mastercard', expectedBrand: 'mastercard', expectedLast4: '4444' },
  { id: 'amex', token: 'tok_amex', expectedBrand: 'amex', expectedLast4: '8431' },
];

const DECLINE_SCENARIOS = [
  { id: 'generic_decline', token: 'tok_chargeDeclined', expectedCode: 'card_declined' },
  { id: 'insufficient_funds', token: 'tok_chargeDeclinedInsufficientFunds', expectedCode: 'card_declined' },
  { id: 'expired_card', token: 'tok_chargeDeclinedExpiredCard', expectedCode: 'expired_card' },
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

      // Log
      await ReporterHelper.logApiCall(
        `Tokenize & Charge — ${scenario.id}`,
        { url: `${BASE_URL}/charges`, method: 'POST', headers, body: form },
        response
      );

      const body = await response.json();
      const reader = new ChargeReader(body);

      // Assert
      await PaymentAssertions.assertSuccess(response);
      PaymentAssertions.assertChargeSucceeded(reader);
      PaymentAssertions.assertChargeCardBrand(reader, scenario.expectedBrand);
      PaymentAssertions.assertChargeCardLast4(reader, scenario.expectedLast4);
      PaymentAssertions.assertNoPANInResponse(body, scenario.token);

      await ReporterHelper.logAssertion('Tokenization Verified', {
        token: scenario.token,
        cardBrand: reader.getCardBrand(),
        last4: reader.getCardLast4(),
        panExposed: false,
      });
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

      // Log
      await ReporterHelper.logApiCall(
        `Decline — ${scenario.id}`,
        { url: `${BASE_URL}/charges`, method: 'POST', headers, body: form },
        response
      );

      const body = await response.json();
      const errorReader = new ChargeErrorReader(body);

      // Assert
      await PaymentAssertions.assertDeclined(response);
      PaymentAssertions.assertChargeDeclineCode(errorReader, scenario.expectedCode);

      await ReporterHelper.logAssertion('Decline Verified', {
        errorCode: errorReader.getCode(),
        declineCode: errorReader.getDeclineCode(),
        message: errorReader.getMessage(),
      });
    });
  }

  // ─── PAN Security ────────────────────────────────────────────

  test('should never expose raw card number in response', async ({ request }) => {
    // Arrange
    const form = { amount: '1000', currency: 'usd', source: 'tok_visa' };

    // Act
    const response = await request.post(`${BASE_URL}/charges`, { headers, form });

    // Log
    await ReporterHelper.logApiCall(
      'PAN Security Check',
      { url: `${BASE_URL}/charges`, method: 'POST', headers, body: form },
      response
    );

    const body = await response.json();

    // Assert
    await PaymentAssertions.assertSuccess(response);
    PaymentAssertions.assertNoPANInResponse(body, '4242424242424242');

    await ReporterHelper.logAssertion('PAN Security', {
      panExposed: false,
      message: 'Raw card number not found in response',
    });
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

    // Log
    await ReporterHelper.logApiCall(
      'Unauthorized Request',
      { url: `${BASE_URL}/charges`, method: 'POST', headers: { Authorization: 'Bearer sk_test_invalid' } },
      response
    );

    // Assert
    await PaymentAssertions.assertUnauthorized(response);
  });

});