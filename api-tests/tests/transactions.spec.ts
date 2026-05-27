import { test } from '@playwright/test';
import { ChargeBuilder } from '../builders/charge.builder';
import { ChargeReader, ChargeErrorReader } from '../readers/charge.reader';
import { PaymentAssertions } from '../assertions/payment.assertions';
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
      const body = await response.json();
      console.log(body);
      const reader = new ChargeReader(body);

      // Assert
      await PaymentAssertions.assertSuccess(response);
      PaymentAssertions.assertChargeSucceeded(reader);
      PaymentAssertions.assertChargeAmount(reader, charge.amount);
      PaymentAssertions.assertChargeCurrency(reader, charge.currency);
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
      const body = await response.json();
      console.log(body);
      const errorReader = new ChargeErrorReader(body);

      // Assert
      await PaymentAssertions.assertDeclined(response);
      PaymentAssertions.assertChargeDeclineCode(errorReader, charge.expectedErrorCode);
    });
  }

  // ─── Retrieve Charge ─────────────────────────────────────────

  test('should retrieve existing charge', async ({ request }) => {
    // Arrange — create first
    const form = new ChargeBuilder()
      .withAmount(1500)
      .withDescription('Retrieve test')
      .build();

    const createRes = await request.post(`${BASE_URL}/charges`, { headers, form });
    const created = await createRes.json();
    const createdReader = new ChargeReader(created);

    // Act
    const getRes = await request.get(`${BASE_URL}/charges/${createdReader.getId()}`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });
    const body = await getRes.json();
    console.log(body);
    const reader = new ChargeReader(body);

    // Assert
    await PaymentAssertions.assertSuccess(getRes);
    PaymentAssertions.assertChargeAmount(reader, 1500);
  });

  // ─── Metadata ────────────────────────────────────────────────

  test('should persist metadata on charge', async ({ request }) => {
    // Arrange
    const metadata = { order_id: 'ORD-001', env: 'test' };
    const form = new ChargeBuilder()
      .withAmount(2500)
      .withMetadata(metadata)
      .build();

    // Act
    const response = await request.post(`${BASE_URL}/charges`, { headers, form });
    const body = await response.json();
    console.log(body);
    const reader = new ChargeReader(body);

    // Assert
    await PaymentAssertions.assertSuccess(response);
    PaymentAssertions.assertChargeMetadata(reader, metadata);
  });

  // ─── List ────────────────────────────────────────────────────

  test('should list charges with limit', async ({ request }) => {
    // Act
    const response = await request.get(`${BASE_URL}/charges?limit=5`, {
      headers: { Authorization: `Bearer ${SECRET_KEY}` },
    });
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

    // Assert
    await PaymentAssertions.assertUnauthorized(response);
  });

});