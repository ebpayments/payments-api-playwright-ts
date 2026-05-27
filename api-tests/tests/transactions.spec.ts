import { test } from '@playwright/test';
import { ChargeBuilder } from '../builders/charge.builder';
import { ChargeReader, ChargeErrorReader } from '../readers/charge.reader';
import { PaymentAssertions } from '../assertions/payment.assertions';
import { ReporterHelper } from '../../utils/reporter.helper';
import chargesData from '../data/charges.json';

const BASE_URL = 'https://api.stripe.com/v1';
const SECRET_KEY = process.env.API_TOKEN!;

const headers = {
  Authorization: `Bearer ${SECRET_KEY}`,
  'Content-Type': 'application/x-www-form-urlencoded',
};

test.describe('Stripe — Charges (Transactions)', () => {

  // ─── Happy Path — JSON data driven ──────────────────────────

  for (const charge of chargesData.validCharges) {
    test(`should create charge successfully — ${charge.id}`, async ({ request }) => {
      // Arrange
      const form = new ChargeBuilder()
        .withAmount(charge.amount)
        .withCurrency(charge.currency)
        .withSource(charge.source)
        .withDescription(charge.description)
        .build();

      // Act
      const response = await request.post(`${BASE_URL}/charges`, { headers, form });

      // Log
      await ReporterHelper.logApiCall(
        `Create Charge — ${charge.id}`,
        { url: `${BASE_URL}/charges`, method: 'POST', headers, body: form },
        response
      );

      const body = await response.json();
      const reader = new ChargeReader(body);

      // Assert
      await PaymentAssertions.assertSuccess(response);
      PaymentAssertions.assertChargeSucceeded(reader);
      PaymentAssertions.assertChargeAmount(reader, charge.amount);
      PaymentAssertions.assertChargeCurrency(reader, charge.currency);

      await ReporterHelper.logAssertion('Charge Succeeded', {
        id: reader.getId(),
        amount: reader.getAmount(),
        currency: reader.getCurrency(),
        status: reader.getStatus(),
        cardBrand: reader.getCardBrand(),
        last4: reader.getCardLast4(),
        riskScore: reader.getRiskScore(),
      });
    });
  }

  // ─── Decline Scenarios — JSON data driven ───────────────────

  for (const charge of chargesData.declinedCharges) {
    test(`should decline charge — ${charge.id}`, async ({ request }) => {
      // Arrange
      const form = new ChargeBuilder()
        .withAmount(charge.amount)
        .withCurrency(charge.currency)
        .withSource(charge.source)
        .withDescription(charge.description)
        .build();

      // Act
      const response = await request.post(`${BASE_URL}/charges`, { headers, form });

      // Log
      await ReporterHelper.logApiCall(
        `Declined Charge — ${charge.id}`,
        { url: `${BASE_URL}/charges`, method: 'POST', headers, body: form },
        response
      );

      const body = await response.json();
      const errorReader = new ChargeErrorReader(body);

      // Assert
      await PaymentAssertions.assertDeclined(response);
      PaymentAssertions.assertChargeDeclineCode(errorReader, charge.expectedErrorCode);

      await ReporterHelper.logAssertion('Charge Declined', {
        errorCode: errorReader.getCode(),
        declineCode: errorReader.getDeclineCode(),
        message: errorReader.getMessage(),
      });
    });
  }

  // ─── Retrieve Charge ─────────────────────────────────────────

  test('should retrieve existing charge', async ({ request }) => {
    // Arrange
    const form = new ChargeBuilder().withAmount(1500).withDescription('Retrieve test').build();
    const createRes = await request.post(`${BASE_URL}/charges`, { headers, form });
    const created = await createRes.json();
    const createdReader = new ChargeReader(created);

    // Act
    const getRes = await request.get(`${BASE_URL}/charges/${createdReader.getId()}`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });

    // Log
    await ReporterHelper.logApiCall(
      'Retrieve Charge',
      { url: `${BASE_URL}/charges/${createdReader.getId()}`, method: 'GET', headers: { Authorization: `Bearer ${SECRET_KEY}` } },
      getRes
    );

    const body = await getRes.json();
    const reader = new ChargeReader(body);

    // Assert
    await PaymentAssertions.assertSuccess(getRes);
    PaymentAssertions.assertChargeAmount(reader, 1500);

    await ReporterHelper.logAssertion('Charge Retrieved', {
      id: reader.getId(),
      amount: reader.getAmount(),
      status: reader.getStatus(),
    });
  });

  // ─── Metadata ────────────────────────────────────────────────

  test('should persist metadata on charge', async ({ request }) => {
    // Arrange
    const metadata = { order_id: 'ORD-001', env: 'test' };
    const form = new ChargeBuilder().withAmount(2500).withMetadata(metadata).build();

    // Act
    const response = await request.post(`${BASE_URL}/charges`, { headers, form });

    // Log
    await ReporterHelper.logApiCall(
      'Charge with Metadata',
      { url: `${BASE_URL}/charges`, method: 'POST', headers, body: form },
      response
    );

    const body = await response.json();
    const reader = new ChargeReader(body);

    // Assert
    await PaymentAssertions.assertSuccess(response);
    PaymentAssertions.assertChargeMetadata(reader, metadata);

    await ReporterHelper.logAssertion('Metadata Persisted', {
      metadata: reader.getMetadata(),
    });
  });

  // ─── List ────────────────────────────────────────────────────

  test('should list charges with limit', async ({ request }) => {
    // Act
    const response = await request.get(`${BASE_URL}/charges?limit=5`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });

    // Log
    await ReporterHelper.logApiCall(
      'List Charges',
      { url: `${BASE_URL}/charges?limit=5`, method: 'GET', headers: { Authorization: `Bearer ${SECRET_KEY}` } },
      response
    );

    const body = await response.json();

    // Assert
    await PaymentAssertions.assertSuccess(response);
    test.expect(body.object).toBe('list');
    test.expect(body.data).toBeInstanceOf(Array);
    test.expect(body.data.length).toBeLessThanOrEqual(5);
  });

  // ─── Auth ────────────────────────────────────────────────────

  test('should return 401 with invalid API key', async ({ request }) => {
    // Act
    const response = await request.get(`${BASE_URL}/charges`, {
      headers: { Authorization: 'Bearer sk_test_invalid' },
    });

    // Log
    await ReporterHelper.logApiCall(
      'Unauthorized Request',
      { url: `${BASE_URL}/charges`, method: 'GET', headers: { Authorization: 'Bearer sk_test_invalid' } },
      response
    );

    // Assert
    await PaymentAssertions.assertUnauthorized(response);
  });

});