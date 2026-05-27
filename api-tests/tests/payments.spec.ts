import { test } from '@playwright/test';
import { PaymentIntentBuilder } from '../builders/payment-intent.builder';
import { PaymentIntentReader, PaymentIntentErrorReader } from '../readers/payment-intent.reader';
import { PaymentAssertions } from '../assertions/payment.assertions';
import { ReporterHelper } from '../../utils/reporter.helper';
import paymentIntentsData from '../data/payment-intents.json';

const BASE_URL = 'https://api.stripe.com/v1';
const SECRET_KEY = process.env.API_TOKEN!;

const headers = {
  Authorization: `Bearer ${SECRET_KEY}`,
  'Content-Type': 'application/x-www-form-urlencoded',
};

test.describe('Stripe — Payment Intents', () => {

  // ─── Create — JSON data driven ───────────────────────────────

  for (const intent of paymentIntentsData.validIntents) {
    test(`should create payment intent — ${intent.id}`, async ({ request }) => {
      // Arrange
      const form = new PaymentIntentBuilder()
        .withAmount(intent.amount)
        .withCurrency(intent.currency)
        .withDescription(intent.description)
        .build();

      // Act
      const response = await request.post(`${BASE_URL}/payment_intents`, { headers, form });

      // Log
      await ReporterHelper.logApiCall(
        `Create Payment Intent — ${intent.id}`,
        { url: `${BASE_URL}/payment_intents`, method: 'POST', headers, body: form },
        response
      );

      const body = await response.json();
      const reader = new PaymentIntentReader(body);

      // Assert
      await PaymentAssertions.assertSuccess(response);
      PaymentAssertions.assertPaymentIntentCreated(reader);
      PaymentAssertions.assertPaymentIntentAmount(reader, intent.amount);
      PaymentAssertions.assertPaymentIntentCurrency(reader, intent.currency);
      PaymentAssertions.assertPaymentIntentStatus(reader, intent.expectedStatus);

      await ReporterHelper.logAssertion('Payment Intent Created', {
        id: reader.getId(),
        amount: reader.getAmount(),
        currency: reader.getCurrency(),
        status: reader.getStatus(),
      });
    });
  }

  // ─── Confirm — JSON data driven ──────────────────────────────

  for (const intent of paymentIntentsData.confirmedIntents) {
    test(`should confirm payment intent — ${intent.id}`, async ({ request }) => {
      // Arrange
      const form = new PaymentIntentBuilder()
        .withAmount(intent.amount)
        .withCurrency(intent.currency)
        .withPaymentMethod(intent.paymentMethod)
        .withConfirm()
        .build();

      // Act
      const response = await request.post(`${BASE_URL}/payment_intents`, { headers, form });

      // Log
      await ReporterHelper.logApiCall(
        `Confirm Payment Intent — ${intent.id}`,
        { url: `${BASE_URL}/payment_intents`, method: 'POST', headers, body: form },
        response
      );

      const body = await response.json();
      const reader = new PaymentIntentReader(body);

      // Assert
      await PaymentAssertions.assertSuccess(response);
      PaymentAssertions.assertPaymentIntentSucceeded(reader);
      PaymentAssertions.assertPaymentIntentAmount(reader, intent.amount);

      await ReporterHelper.logAssertion('Payment Intent Succeeded', {
        id: reader.getId(),
        status: reader.getStatus(),
        amountReceived: reader.getAmountReceived(),
        latestCharge: reader.getLatestCharge(),
      });
    });
  }

  // ─── Validation Errors — JSON data driven ────────────────────

  for (const intent of paymentIntentsData.invalidIntents) {
    test(`should return error for invalid intent — ${intent.id}`, async ({ request }) => {
      // Arrange
      let builder = new PaymentIntentBuilder();
      if ('amount' in intent) builder = builder.withAmount(intent.amount!);
      else builder = builder.withoutAmount();
      if ('currency' in intent) builder = builder.withCurrency(intent.currency!);
      else builder = builder.withoutCurrency();
      const form = builder.build();

      // Act
      const response = await request.post(`${BASE_URL}/payment_intents`, { headers, form });

      // Log
      await ReporterHelper.logApiCall(
        `Invalid Payment Intent — ${intent.id}`,
        { url: `${BASE_URL}/payment_intents`, method: 'POST', headers, body: form },
        response
      );

      const body = await response.json();
      const errorReader = new PaymentIntentErrorReader(body);

      // Assert
      await PaymentAssertions.assertBadRequest(response);
      PaymentAssertions.assertMissingParam(errorReader, intent.expectedErrorParam!);

      await ReporterHelper.logAssertion('Validation Error', {
        errorCode: errorReader.getCode(),
        missingParam: errorReader.getParam(),
      });
    });
  }

  // ─── Retrieve ────────────────────────────────────────────────

  test('should retrieve existing payment intent', async ({ request }) => {
    // Arrange
    const form = new PaymentIntentBuilder().withAmount(1000).withDescription('Retrieve test').build();
    const createRes = await request.post(`${BASE_URL}/payment_intents`, { headers, form });
    const created = await createRes.json();
    const createdReader = new PaymentIntentReader(created);

    // Act
    const getRes = await request.get(`${BASE_URL}/payment_intents/${createdReader.getId()}`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });

    // Log
    await ReporterHelper.logApiCall(
      'Retrieve Payment Intent',
      { url: `${BASE_URL}/payment_intents/${createdReader.getId()}`, method: 'GET', headers: { Authorization: `Bearer ${SECRET_KEY}` } },
      getRes
    );

    const body = await getRes.json();
    const reader = new PaymentIntentReader(body);

    // Assert
    await PaymentAssertions.assertSuccess(getRes);
    PaymentAssertions.assertPaymentIntentAmount(reader, 1000);
  });

  // ─── List ────────────────────────────────────────────────────

  test('should list payment intents', async ({ request }) => {
    // Act
    const response = await request.get(`${BASE_URL}/payment_intents?limit=5`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });

    // Log
    await ReporterHelper.logApiCall(
      'List Payment Intents',
      { url: `${BASE_URL}/payment_intents?limit=5`, method: 'GET', headers: { Authorization: `Bearer ${SECRET_KEY}` } },
      response
    );

    const body = await response.json();

    // Assert
    await PaymentAssertions.assertSuccess(response);
    test.expect(body.object).toBe('list');
    test.expect(body.data).toBeInstanceOf(Array);
  });

  // ─── Auth ────────────────────────────────────────────────────

  test('should return 401 with invalid API key', async ({ request }) => {
    // Act
    const response = await request.post(`${BASE_URL}/payment_intents`, {
      headers: {
        Authorization: 'Bearer sk_test_invalid',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      form: new PaymentIntentBuilder().build(),
    });

    // Log
    await ReporterHelper.logApiCall(
      'Unauthorized Request',
      { url: `${BASE_URL}/payment_intents`, method: 'POST', headers: { Authorization: 'Bearer sk_test_invalid' } },
      response
    );

    // Assert
    await PaymentAssertions.assertUnauthorized(response);
  });

});